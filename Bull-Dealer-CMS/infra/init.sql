CREATE TABLE dealers (id INT PRIMARY KEY, name VARCHAR(200) NOT NULL, location VARCHAR(100) NOT NULL, address TEXT NOT NULL, about TEXT NOT NULL, active BOOLEAN NOT NULL DEFAULT TRUE);
CREATE TABLE dealer_domains (domain VARCHAR(253) PRIMARY KEY, dealer_id INT NOT NULL, FOREIGN KEY (dealer_id) REFERENCES dealers(id));
CREATE TABLE products (id VARCHAR(40) PRIMARY KEY, name VARCHAR(100) NOT NULL, category VARCHAR(100) NOT NULL, image VARCHAR(500) NOT NULL, tag VARCHAR(100) NOT NULL, description TEXT NOT NULL, url VARCHAR(500) NOT NULL, sort_order INT NOT NULL DEFAULT 0, active BOOLEAN NOT NULL DEFAULT TRUE);
CREATE TABLE enquiries (id BIGINT AUTO_INCREMENT PRIMARY KEY, reference VARCHAR(50) UNIQUE NOT NULL, dealer_id INT NOT NULL, name VARCHAR(100) NOT NULL, phone VARCHAR(20) NOT NULL, email VARCHAR(150), product VARCHAR(100) NOT NULL, message TEXT NOT NULL, consent BOOLEAN NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (dealer_id) REFERENCES dealers(id), INDEX dealer_created (dealer_id, created_at));
INSERT INTO dealers VALUES (1,'Tara Auto Hub Pvt. Ltd.','Bihar','E1-50 Block Jai Prakash Nagar, Digha Ashiana Road, Digha, Patna, Bihar 800011','Established in 2016, Tara Auto Hub is a BULL channel partner serving Bihar. We bring local knowledge and a personal approach to equipment sales, service enquiries, and ownership support.',1);
INSERT INTO dealer_domains VALUES ('bulltaraautohub.com',1),('www.bulltaraautohub.com',1),('localhost',1),('127.0.0.1',1);
INSERT INTO products (id,name,category,image,tag,description,url,sort_order) VALUES
('sd76','SD76 Super Smart','Backhoe loaders','/images/backhoe.png','SUPER SMART','A versatile backhoe loader for demanding digging and loading applications.','https://www.bullindia.com/bull-sd76-bs5-super-smart.php',1),
('hd76','HD76 Loader','Backhoe loaders','/images/loader.png','BUILT FOR THE LOAD','A capable loading partner for material handling and everyday site work.','https://www.bullindia.com/bull-hd-76-loader.php',2),
('av490','AV490 Skid Steer','Skid steers','/images/skid.png','COMPACT & CAPABLE','Compact equipment designed for versatile work in space-conscious environments.','https://www.bullindia.com/bull-skid-steer-av490.php',3),
('smartkid','Smart Kid','Skid steers','/images/smartkid.png','SMALL SIZE. BIG POSSIBILITIES.','Explore the compact BULL range for your next specialised application.','https://www.bullindia.com/',4);


-- Apply once to an existing database before deploying this version.
ALTER TABLE products
 ADD COLUMN menu_label VARCHAR(100) NOT NULL DEFAULT '',
 ADD COLUMN menu_image VARCHAR(500) NOT NULL DEFAULT '',
 ADD COLUMN show_in_menu BOOLEAN NOT NULL DEFAULT FALSE,
 ADD COLUMN menu_order INT NOT NULL DEFAULT 0;
UPDATE products SET menu_label = 'SD76 - BS5 SUPER SMART', menu_image = '/Asset/Images/nav product/product-sd76-bs4.png', show_in_menu = 1, menu_order = 1 WHERE id = 'sd76';
UPDATE products SET menu_label = 'BULL LOADER HD76', menu_image = '/Asset/Images/nav product/bull-loader-hd76-sm.png', show_in_menu = 1, menu_order = 2 WHERE id = 'hd76';
UPDATE products SET menu_label = 'SKID STEER – AV490', menu_image = '/Asset/Images/nav product/skid-stree-sm.png', show_in_menu = 1, menu_order = 3 WHERE id = 'av490';
UPDATE products SET menu_label = 'BULL SMART KID', menu_image = '', show_in_menu = 0, menu_order = 4 WHERE id = 'smartkid';
