import { getAdminDb } from './firebase';

export interface QueryOptions {
  where?: Record<string, any>;
  orderBy?: { [key: string]: 'asc' | 'desc' };
  skip?: number;
  take?: number;
  q?: string;
  searchFields?: string[];
}

export const firestoreDb = {
  // Query collection with Prisma-like syntax
  async findMany<T = any>(collectionName: string, options: QueryOptions = {}): Promise<T[]> {
    const db = getAdminDb();
    let query: FirebaseFirestore.Query = db.collection(collectionName);

    if (options.where) {
      Object.entries(options.where).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          query = query.where(key, '==', val);
        }
      });
    }

    if (options.orderBy) {
      Object.entries(options.orderBy).forEach(([field, dir]) => {
        query = query.orderBy(field, dir);
      });
    }

    const snapshot = await query.get();
    let results: T[] = snapshot.docs.map((doc) => ({
      id: isNaN(Number(doc.id)) ? doc.id : Number(doc.id),
      ...doc.data(),
    })) as T[];

    // In-memory text search filter if q is provided
    if (options.q && options.searchFields && options.searchFields.length > 0) {
      const searchTerm = options.q.toLowerCase();
      results = results.filter((item: any) =>
        options.searchFields!.some((field) => {
          const val = item[field];
          return val && String(val).toLowerCase().includes(searchTerm);
        })
      );
    }

    // Manual pagination (skip/take) for in-memory / filtered results
    if (options.skip !== undefined || options.take !== undefined) {
      const skip = options.skip || 0;
      const take = options.take || results.length;
      results = results.slice(skip, skip + take);
    }

    return results;
  },

  // Count items matching criteria
  async count(collectionName: string, options: QueryOptions = {}): Promise<number> {
    const items = await this.findMany(collectionName, {
      where: options.where,
      q: options.q,
      searchFields: options.searchFields,
    });
    return items.length;
  },

  // Find document by ID
  async findById<T = any>(collectionName: string, id: string | number): Promise<T | null> {
    const db = getAdminDb();
    const docRef = db.collection(collectionName).doc(String(id));
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: isNaN(Number(doc.id)) ? doc.id : Number(doc.id),
      ...doc.data(),
    } as T;
  },

  // Create a document (auto ID or explicit ID)
  async create<T = any>(collectionName: string, data: any): Promise<T> {
    const db = getAdminDb();
    const now = new Date().toISOString();
    const cleanData = {
      ...data,
      createdAt: data.createdAt || now,
      updatedAt: now,
    };

    if (data.id) {
      const docId = String(data.id);
      await db.collection(collectionName).doc(docId).set(cleanData);
      return { id: data.id, ...cleanData } as T;
    } else {
      const docRef = await db.collection(collectionName).add(cleanData);
      return { id: docRef.id, ...cleanData } as T;
    }
  },

  // Update a document
  async update<T = any>(collectionName: string, id: string | number, data: any): Promise<T> {
    const db = getAdminDb();
    const docRef = db.collection(collectionName).doc(String(id));
    const now = new Date().toISOString();
    const updateData = {
      ...data,
      updatedAt: now,
    };

    await docRef.set(updateData, { merge: true });
    const updatedDoc = await docRef.get();
    return {
      id: isNaN(Number(id)) ? id : Number(id),
      ...updatedDoc.data(),
    } as T;
  },

  // Delete a document
  async delete(collectionName: string, id: string | number): Promise<boolean> {
    const db = getAdminDb();
    await db.collection(collectionName).doc(String(id)).delete();
    return true;
  },
};
