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
