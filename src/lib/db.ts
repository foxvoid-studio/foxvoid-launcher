import Database from "@tauri-apps/plugin-sql";

// Define the structure of a Project
export interface Project {
    id: number;
    name: string;
    path: string;
    last_opened?: string,
    created_at: string;
}

let dbInstance: Database | null = null;

// Initialize the database connection and create table if not exists
export async function initDB() {
    if (dbInstance) return dbInstance;

    // "foxvoid.db" will be created in the AppData folder
    dbInstance = await Database.load("sqlite:foxvoid.db");

    // Projects Table
    await dbInstance.execute(`
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            path TEXT NOT NULL,
            last_opened DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );  
    `);

    // Settings Table (Key-Value store)
    await dbInstance.execute(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
    `);

    return dbInstance;
}

// Add a new project to the database
export async function addProjectToDB(name: string, path: string) {
    const db = await initDB();
    
    // Normalize path to avoid double slashes like "C:/Users//Project"
    // Remove trailing slash if present before joining
    const cleanPath = path.replace(/[\\/]$/, "");
    // Detect separator based on OS style (simplified check)
    const separator = cleanPath.includes("\\") ? "\\" : "/";
    const fullPath = `${cleanPath}${separator}${name}`;

    console.log(`Saving project to DB: ${name} at ${fullPath}`); // Debug log

    await db.execute(
        'INSERT INTO projects (name, path, last_opened) VALUES ($1, $2, CURRENT_TIMESTAMP)',
        [name, fullPath]
    );
}

// Get all projects sorted by last opened (most recent first)
export async function getProjects(): Promise<Project[]> {
    const db = await initDB();
    return await db.select("SELECT * FROM projects ORDER BY created_at DESC");
}

// Delete a project (optional helper)
export async function deleteProjectFromDB(id: number) {
    const db = await initDB();
    await db.execute('DELETE FROM projects WHERE id = $1', [id]);
}

export async function saveSetting(key: string, value: string) {
    const db = await initDB();

    // SQLite upsert syntax (INSERT OR REPLACE)
    await db.execute(
        'INSERT OR REPLACE INTO settings (key, value) VALUES ($1, $2);',
        [key, value]
    );
}

export async function getSetting(key: string): Promise<string | null> {
    const db = await initDB();
    const result = await db.select<{ value: string }[]>(
        'SELECT value FROM settings WHERE key = $1;',
        [key]
    );

    if (result.length > 0) {
        return result[0].value;
    }
    return null;
}
