import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface FieldDefinition {
  name: string;
  description: string;
  type: string;
}

export interface FieldConfiguration {
  id?: number;
  name: string;
  fields: FieldDefinition[];
  createdAt: number;
  updatedAt: number;
  lastUsedAt?: number;
}

interface ConfigDB extends DBSchema {
  configurations: {
    key: number;
    value: FieldConfiguration;
    indexes: { 'by-name': string };
  };
}

const DB_NAME = 'pdf-extractor-db';
const DB_VERSION = 2;

let dbInstance: IDBPDatabase<ConfigDB> | null = null;

async function getDB(): Promise<IDBPDatabase<ConfigDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<ConfigDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Create store if it doesn't exist (version 0 -> 1)
      if (oldVersion < 1) {
        const store = db.createObjectStore('configurations', {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('by-name', 'name', { unique: true });
      }
      // Version 1 -> 2: No schema changes needed, just added lastUsedAt field to interface
      // IndexedDB is schemaless for object properties, so no migration needed
    },
  });

  return dbInstance;
}

export async function saveConfiguration(config: Omit<FieldConfiguration, 'id'>): Promise<number> {
  const db = await getDB();

  // Check if configuration with this name already exists
  const existing = await getConfigurationByName(config.name);
  if (existing) {
    // Update existing configuration
    const updated: FieldConfiguration = {
      ...existing,
      fields: config.fields,
      updatedAt: Date.now(),
    };
    await db.put('configurations', updated);
    return existing.id!;
  } else {
    // Create new configuration
    const id = await db.add('configurations', {
      ...config,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as FieldConfiguration);
    return id;
  }
}

export async function getConfiguration(id: number): Promise<FieldConfiguration | undefined> {
  const db = await getDB();
  return await db.get('configurations', id);
}

export async function getConfigurationByName(name: string): Promise<FieldConfiguration | undefined> {
  const db = await getDB();
  return await db.getFromIndex('configurations', 'by-name', name);
}

export async function getAllConfigurations(): Promise<FieldConfiguration[]> {
  const db = await getDB();
  return await db.getAll('configurations');
}

export async function deleteConfiguration(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('configurations', id);
}

export async function updateConfiguration(config: FieldConfiguration): Promise<void> {
  const db = await getDB();
  await db.put('configurations', {
    ...config,
    updatedAt: Date.now(),
  });
}

export async function markConfigurationAsUsed(id: number): Promise<void> {
  const db = await getDB();
  const config = await db.get('configurations', id);
  if (config) {
    await db.put('configurations', {
      ...config,
      lastUsedAt: Date.now(),
    });
  }
}
