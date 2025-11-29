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

    // Create the table
    await dbInstance.execute(`
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            path TEXT NOT NULL,
            last_opened DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )    
    `);

    return dbInstance;
}

// Add a new project to the database
export async function addProjectToDB(name: string, path: string) {
    const db = await initDB();

    // We construct the full path manually or rely on what was sent to Rust
    // Ideally, we should use the path API, but simple concatenation works for storage
    // Assuming 'path' is the parent folder
    const fullPath = path.endsWith('/') || path.endsWith('\\') 
        ? `${path}${name}` 
        : `${path}/${name}`;

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
