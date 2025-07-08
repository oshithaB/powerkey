async function createTables(db) {

    const tables = [
        `CREATE TABLE IF NOT EXISTS company (
            company_id int NOT NULL AUTO_INCREMENT,
            name varchar(200) NOT NULL,
            is_taxable tinyint(1) NOT NULL DEFAULT '0',
            tax_number varchar(100) DEFAULT NULL,
            company_logo varchar(255) DEFAULT NULL,
            address text NOT NULL,
            contact_number varchar(20) NOT NULL,
            email_address varchar(255) DEFAULT NULL,
            registration_number varchar(100) NOT NULL,
            terms_and_conditions text,
            notes text,
            created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
        `CREATE TABLE IF NOT EXISTS customers (
            id int NOT NULL AUTO_INCREMENT,
            company_id int NOT NULL,
            customer_code varchar(50),
            name varchar(200) NOT NULL,
            email varchar(255),
            phone varchar(20),
            address text,
            city varchar(100),
            state varchar(100),
            zip_code varchar(20),
            country varchar(100),
            vehicle_number varchar(50),
            credit_limit decimal(15,2) DEFAULT 0,
            is_taxable tinyint(1) NOT NULL DEFAULT 0,
            customer_tax_number varchar(100) DEFAULT NULL,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY company_id (company_id),
            CONSTRAINT customers_ibfk_1 FOREIGN KEY (company_id) REFERENCES company (company_id)
        )`,
        // `CREATE TABLE IF NOT EXISTS products (
        //     id int NOT NULL AUTO_INCREMENT,
        //     company_id int NOT NULL,
        //     sku varchar(100),
        //     name varchar(200) NOT NULL,
        //     description text,
        //     category varchar(100),
        //     unit_price decimal(15,2) DEFAULT 0,
        //     cost_price decimal(15,2) DEFAULT 0,
        //     quantity_on_hand int DEFAULT 0,
        //     reorder_level int DEFAULT 0,
        //     is_active tinyint(1) DEFAULT 1,
        //     created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        //     PRIMARY KEY (id),
        //     KEY company_id (company_id),
        //     CONSTRAINT products_ibfk_1 FOREIGN KEY (company_id) REFERENCES company (company_id)
        // )`,
        // `CREATE TABLE IF NOT EXISTS invoices (
        //     id int NOT NULL AUTO_INCREMENT,
        //     company_id int NOT NULL,
        //     invoice_number varchar(100),
        //     customer_id int,
        //     employee_id int,
        //     estimate_id int,
        //     invoice_date date NOT NULL,
        //     due_date date,
        //     subtotal decimal(15,2) DEFAULT 0,
        //     discount_type enum('percentage','fixed') DEFAULT 'fixed',
        //     discount_value decimal(15,2) DEFAULT 0,
        //     discount_amount decimal(15,2) DEFAULT 0,
        //     tax_amount decimal(15,2) DEFAULT 0,
        //     total_amount decimal(15,2) DEFAULT 0,
        //     paid_amount decimal(15,2) DEFAULT 0,
        //     balance_due decimal(15,2) DEFAULT 0,
        //     status enum('draft','sent','paid','partially_paid','overdue','cancelled') DEFAULT 'draft',
        //     notes text,
        //     terms text,
        //     created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        //     PRIMARY KEY (id),
        //     KEY company_id (company_id),
        //     KEY customer_id (customer_id),
        //     CONSTRAINT invoices_ibfk_1 FOREIGN KEY (company_id) REFERENCES company (company_id),
        //     CONSTRAINT invoices_ibfk_2 FOREIGN KEY (customer_id) REFERENCES customers (id)
        // )`,
        `CREATE TABLE IF NOT EXISTS tax_rates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_id int NOT NULL,
            name VARCHAR(100) NOT NULL,
            rate DECIMAL(5,2) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            KEY company_id (company_id),
            CONSTRAINT tax_rates_ibfk_1 FOREIGN KEY (company_id) REFERENCES company (company_id)
        )`,
        `CREATE TABLE IF NOT EXISTS employees (
            id int NOT NULL AUTO_INCREMENT,
            name varchar(200) NOT NULL,
            email varchar(255),
            phone varchar(20),
            address text,
            hire_date date,
            is_active tinyint(1) DEFAULT 1,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY email (email)
        )`,
    ];

    for (const table of tables) {
        try {
        await db.execute(table);
        } catch (error) {
        console.error('Error creating table:', error);
        }
    }

    // Insert default roles if they don't exist
    try {
        const [existingRoles] = await db.execute('SELECT COUNT(*) as count FROM role');
        if (existingRoles[0].count === 0) {
            await db.execute("INSERT INTO role (name) VALUES ('admin')");
            console.log('Default roles inserted');
        }
    } catch (error) {
        console.error('Error inserting default roles:', error);
    }
}

module.exports = createTables;