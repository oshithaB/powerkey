async function createTables(db) {

    const tables = [
        `CREATE TABLE IF NOT EXISTS company (
            company_id int NOT NULL AUTO_INCREMENT,
            name varchar(200) NOT NULL,
            is_taxable tinyint(1) NOT NULL DEFAULT '0',
            created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            company_logo varchar(255) DEFAULT NULL,
            address text NOT NULL,
            contact_number varchar(20) NOT NULL,
            registration_number varchar(100) NOT NULL,
            PRIMARY KEY (company_id),
            UNIQUE KEY unique_registration_number (registration_number)
        )`,
        `CREATE TABLE IF NOT EXISTS role (
            role_id int NOT NULL AUTO_INCREMENT,
            name varchar(100) NOT NULL,
            created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (role_id)
        )`,
        `CREATE TABLE IF NOT EXISTS user (
            user_id int NOT NULL AUTO_INCREMENT,
            role_id int NOT NULL,
            full_name varchar(200) NOT NULL,
            username varchar(100) DEFAULT NULL,
            email varchar(255) NOT NULL,
            password_hash varchar(255) DEFAULT NULL,
            created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            otp_code varchar(10) DEFAULT NULL,
            otp_expiry datetime DEFAULT NULL,
            PRIMARY KEY (user_id),
            UNIQUE KEY email (email),
            UNIQUE KEY username (username),
            KEY role_id (role_id),
            CONSTRAINT user_ibfk_1 FOREIGN KEY (role_id) REFERENCES role (role_id)
        )`,
        `CREATE TABLE IF NOT EXISTS tax_rates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            rate DECIMAL(5,2) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
    ];

    for (const table of tables) {
        try {
        await db.execute(table);
        } catch (error) {
        console.error('Error creating table:', error);
        }
    }
}

module.exports = createTables;
