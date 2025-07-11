async function createTables(db) {

    const tables = [
        `CREATE TABLE IF NOT EXISTS company (
            company_id int NOT NULL AUTO_INCREMENT,
            name varchar(200) NOT NULL,
            is_taxable tinyint(1) NOT NULL DEFAULT '0',
            tax_number varchar(100) DEFAULT NULL,
            company_logo varchar(255) DEFAULT NULL,
            address text,
            contact_number varchar(20) DEFAULT '',
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
            is_active BOOLEAN DEFAULT TRUE,
            PRIMARY KEY (user_id),
            UNIQUE KEY email (email),
            UNIQUE KEY username (username),
            KEY role_id (role_id),
            CONSTRAINT user_ibfk_1 FOREIGN KEY (role_id) REFERENCES role (role_id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS customer (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_id INT NOT NULL,
            name VARCHAR(255),
            email VARCHAR(255),
            is_taxable BOOLEAN DEFAULT FALSE,
            tax_number VARCHAR(100),
            phone VARCHAR(50),
            vehicle_number VARCHAR(100),
            credit_limit DECIMAL(12, 2) DEFAULT 0.00,
            current_balance DECIMAL(12, 2) DEFAULT 0.00,
            billing_address VARCHAR(255),
            billing_city VARCHAR(100),
            billing_province VARCHAR(100),
            billing_postal_code VARCHAR(20),
            billing_country VARCHAR(100),
            shipping_same_as_billing BOOLEAN DEFAULT FALSE,
            shipping_address VARCHAR(255),
            shipping_city VARCHAR(100),
            shipping_province VARCHAR(100),
            shipping_postal_code VARCHAR(20),
            shipping_country VARCHAR(100),
            primary_payment_method VARCHAR(100),
            terms VARCHAR(100),
            delivery_option VARCHAR(100),
            invoice_language VARCHAR(100),
            sales_tax_registration VARCHAR(100),
            opening_balance DECIMAL(12, 2) DEFAULT 0.00,
            as_of_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (company_id) REFERENCES company(company_id) ON DELETE CASCADE
        );`,
        `CREATE TABLE IF NOT EXISTS vendor (
            vendor_id INT AUTO_INCREMENT PRIMARY KEY,
            company_id INT,
            name VARCHAR(255) NOT NULL,
            vendor_company_name VARCHAR(255) NULL,
            email VARCHAR(255),
            phone VARCHAR(50),
            address TEXT,
            city VARCHAR(100),
            state VARCHAR(100),
            zip_code VARCHAR(20),
            country VARCHAR(100),
            tax_number VARCHAR(100),
            fax_number VARCHAR(50),
            website VARCHAR(255),
            terms VARCHAR(255),
            account_number VARCHAR(100),
            balance DECIMAL(15, 2) DEFAULT 0,
            as_of_date DATE,
            vehicle_number varchar(50),
            billing_rate DECIMAL(10, 2) DEFAULT 0.00,
            default_expense_category VARCHAR(255),
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            KEY company_id (company_id),
            CONSTRAINT vendor_ibfk_1 FOREIGN KEY (company_id) REFERENCES company(company_id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS tax_rates (
            tax_rate_id INT AUTO_INCREMENT PRIMARY KEY,
            company_id int NOT NULL,
            name VARCHAR(100) NOT NULL,
            rate DECIMAL(5,2) NOT NULL,
            is_default BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            KEY company_id (company_id),
            CONSTRAINT tax_rates_ibfk_1 FOREIGN KEY (company_id) REFERENCES company (company_id) ON DELETE CASCADE
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
        `CREATE TABLE IF NOT EXISTS categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            description TEXT,
            amount DECIMAL(15,2) DEFAULT 0.00,
            tax_rate_id INT DEFAULT NULL,
            employee_id INT DEFAULT NULL,
            company_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (tax_rate_id) REFERENCES tax_rates(tax_rate_id) ON DELETE SET NULL,
            FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
            FOREIGN KEY (company_id) REFERENCES company(company_id) ON DELETE CASCADE
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
        // )`
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