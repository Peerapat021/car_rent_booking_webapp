import { id } from 'date-fns/locale';
import { sql } from 'drizzle-orm';
import {
  mysqlTable,
  serial,
  varchar,
  text,
  int,
  decimal,
  datetime,
  date,
  boolean,
  mysqlEnum,
  timestamp,
  longtext,
  json,
  uniqueIndex,
  index
} from 'drizzle-orm/mysql-core';

// ────────────────────────────────────────────────
// Company – ข้อมูลบริษัทหลัก (ใช้แสดงในหน้าเว็บ, ใบเสร็จ, การติดต่อ)
// ────────────────────────────────────────────────
export const company = mysqlTable("Company", {
  company_id: serial("company_id").primaryKey(),                                 // รหัสบริษัทหลัก (auto increment)
  company_name: varchar("company_name", { length: 255 }).notNull(),              // ชื่อบริษัทเต็ม (แสดงทุกที่)
  company_logo: varchar("company_logo", { length: 255 }),                        // URL หรือ path โลโก้บริษัท
  company_description: text("company_description"),                              // คำอธิบายบริษัท (ใช้ใน about us)
  company_phone: varchar("company_phone", { length: 20 }),                       // เบอร์ติดต่อหลักของบริษัท
  company_email: varchar("company_email", { length: 255 }),                      // อีเมลหลักของบริษัท
  company_address: text("company_address"),                                      // ที่อยู่บริษัทเต็ม (ใช้ในใบเสร็จ/ติดต่อ)
  tax_id: varchar("tax_id", { length: 50 }),                                     // เลขประจำตัวผู้เสียภาษี / เลขทะเบียนพาณิชย์
  bank_name: varchar("bank_name", { length: 255 }),                              // ชื่อธนาคารสำหรับโอนเงิน
  bank_account_name: varchar("bank_account_name", { length: 255 }),              // ชื่อบัญชีธนาคาร
  bank_account_number: varchar("bank_account_number", { length: 100 }),          // เลขบัญชีธนาคาร
  promptpay_id: varchar("promptpay_id", { length: 100 }),                        // เลข PromptPay (เบอร์มือถือหรือบัตรประชาชน)
  promptpay_qr: varchar("promptpay_qr", { length: 255 }),                        // URL หรือ path ของ QR Code PromptPay
  facebook_url: varchar("facebook_url", { length: 255 }),                        // ลิงก์เพจ Facebook Official
  instagram_url: varchar("instagram_url", { length: 255 }),                      // ลิงก์ Instagram Official
  tiktok_url: varchar("tiktok_url", { length: 255 }),                            // ลิงก์ TikTok Official
  line_id: varchar("line_id", { length: 255 }),                                  // Line Official ID
  website_url: varchar("website_url", { length: 255 }),                          // URL เว็บไซต์บริษัท
  map_url: varchar("map_url", { length: 500 }),                                  // ลิงก์ Google Maps หรือแผนที่ร้าน
  business_hours: varchar("business_hours", { length: 255 }),                    // เวลาทำการ (ข้อความ เช่น จันทร์-อาทิตย์ 08:00-20:00)
  is_active: boolean("is_active").default(true),                                 // บริษัทเปิดให้บริการหรือไม่ (ปิดระบบชั่วคราว)
  created_by: int("created_by").references(() => users.id),                      // user_id ที่สร้างข้อมูลบริษัท
  updated_by: int("updated_by").references(() => users.id),                      // user_id ที่แก้ไขข้อมูลล่าสุด
  created_at: timestamp("created_at").defaultNow(),                              // วันที่สร้างข้อมูล
  updated_at: timestamp("updated_at").defaultNow().onUpdateNow(),                // วันที่อัปเดตล่าสุด (auto update)
});

// Cities – รูปภาพเพิ่มเติมของรถ
export const cities = mysqlTable('cities', {
  city_id: serial('city_id').primaryKey(),                                       // รหัสเมือง
  city_name: varchar('city_name', { length: 100 }).notNull(),                    // ชื่อเมือง (เช่น กรุงเทพฯ, เชียงใหม่)
  city_code: varchar('city_code', { length: 10 }).unique(),                      // รหัสเมือง (เช่น BKK, CNX)
  city_postal_code: varchar('city_postal_code', { length: 10 }),                 // รหัสไปรษณีย์
  city_status: mysqlEnum('city_status', ['active', 'inactive']).default('active'), // สถานะเมือง (active/inactive)
  created_at: timestamp('created_at').defaultNow().notNull(),            // วันที่เพิ่มเมืองเข้าสู่ระบบ
});

// ────────────────────────────────────────────────
// Branches – สาขาต่าง ๆ
// ────────────────────────────────────────────────
export const branches = mysqlTable('Branches', {
  branch_id: serial('branch_id').primaryKey(),                                   // รหัสสาขา (auto increment)
  city_id: int('city_id')
    .notNull()
    .references(() => cities.city_id, { onDelete: 'restrict' }),                 // รหัสเมืองที่สาขาตั้งอยู่
  branch_name: varchar('branch_name', { length: 100 }).notNull(),                // ชื่อสาขา (เช่น สาขาสุขุมวิท, สาขารามคำแหง)
  branch_address: varchar('branch_address', { length: 255 }).notNull(),          // ที่อยู่สาขาเต็ม
  branch_phone: varchar('branch_phone', { length: 20 }),                         // เบอร์โทรศัพท์สาขา
  branch_url: varchar("branch_url", { length: 255 }),                            // URL หรือ path ของสาขา
  branch_created_by: int('branch_created_by'),        // พนักงาน/แอดมินที่สร้างสาขานี้
  created_at_branch: timestamp('created_at_branch').defaultNow().notNull(),      // วันที่สร้างสาขา
  updated_at_branch: timestamp('updated_at_branch').defaultNow().onUpdateNow().notNull(), // วันที่แก้ไขข้อมูลสาขาล่าสุด
});

// ────────────────────────────────────────────────
// car_classes – กลุ่ม/ประเภทรถ (เช่น Economy, SUV, Luxury)
// ────────────────────────────────────────────────
export const car_classes = mysqlTable("car_classes", {
  class_id: serial("class_id").primaryKey(),                                     // รหัสประเภทรถ
  class_code: varchar("class_code", { length: 20 }).notNull().unique(),          // รหัสย่อ เช่น ECO-A, SUV-P, LUX-V (unique)
  class_name: varchar("class_name", { length: 100 }).notNull(),                  // ชื่อประเภท เช่น Economy Sedan, Premium SUV
  class_description: text("class_description"),                                  // คำอธิบายลักษณะรถในกลุ่มนี้
  sort_order: int("sort_order").default(0),                                      // ลำดับการแสดงในหน้าเลือกประเภทรถ (เลขน้อย = อยู่บน)
  is_active: boolean("is_active").notNull().default(true),                       // ประเภทนี้ยังเปิดให้เช่าหรือไม่
  created_at: timestamp("created_at").defaultNow().notNull(),                    // วันที่สร้างประเภท
  updated_at: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),      // วันที่แก้ไขล่าสุด
});

// ────────────────────────────────────────────────
// Users – ผู้ใช้ทุกประเภท (ลูกค้า, พนักงาน, แอดมิน)
// ────────────────────────────────────────────────
export const users = mysqlTable('Users', {
  id: serial('id').primaryKey(),                                                 // รหัสผู้ใช้หลัก (auto increment)
  name: varchar('name', { length: 100 }).notNull(),                              // ชื่อ-นามสกุลเต็ม
  email: varchar('email', { length: 100 }).notNull().unique(),                   // อีเมล (ใช้ login + unique)
  password: varchar('password', { length: 255 }).notNull(),                      // รหัสผ่าน (ต้อง hashed ก่อนบันทึก)
  birth_date: date('birth_date'),                                                // วันเกิด (ใช้ตรวจอายุ/สิทธิประโยชน์)
  user_phone: varchar('user_phone', { length: 20 }),                             // เบอร์โทรศัพท์ติดต่อ
  user_id_card: varchar('user_id_card', { length: 13 }),                         // ต้องใช้บัตรประชาชน
  user_driver_license: varchar('user_driver_license', { length: 50 }),           // เลขใบขับขี่
  user_driver_license_expiry: date('user_driver_license_expiry'),                // วันหมดอายุใบขับขี่
  user_address: varchar('user_address', { length: 255 }),                        // ที่อยู่ปัจจุบัน (ใช้ส่งเอกสาร/ยืนยัน)
  user_role: mysqlEnum('user_role', ['customer', 'staff', 'admin']).default('customer'), // บทบาท: ลูกค้า / พนักงาน / แอดมิน
  user_blacklist: boolean('user_blacklist').default(false),                      // ถูกแบน/แบล็คลิสต์ (true = ห้ามเช่า)
  branch_id: int('branch_id').references(() => branches.branch_id),              // สาขาที่สังกัด (ใช้กับ staff เท่านั้น)
  create_at_user: timestamp('create_at_user').defaultNow().notNull(),            // วันที่สมัคร/สร้างบัญชี
});

// ────────────────────────────────────────────────
// Cars – ข้อมูลรถแต่ละคัน (สินค้าหลักของระบบ)
// ────────────────────────────────────────────────
export const cars = mysqlTable('Cars', {
  car_id: serial('car_id').primaryKey(),                                         // รหัสรถแต่ละคัน
  class_id: int('class_id').references(() => car_classes.class_id),              // ประเภทรถ (เช่น Economy, SUV)
  branch_id: int('branch_id').references(() => branches.branch_id),              // สาขาที่รถจอดอยู่ปัจจุบัน
  car_created_by: int('car_created_by').references(() => users.id),              // พนักงานที่เพิ่มรถคันนี้
  car_brand: varchar('car_brand', { length: 50 }).notNull(),                     // ยี่ห้อรถ (Toyota, Honda, Mercedes ฯลฯ)
  car_model: varchar('car_model', { length: 50 }).notNull(),                     // รุ่นรถ (Camry, HR-V, C-Class ฯลฯ)
  car_year: int('car_year'),                                                     // ปีรถ (เช่น 2023)
  car_color: varchar('car_color', { length: 20 }),                               // สีตัวถัง (เช่น ดำ, ขาวมุก)
  car_license_plate: varchar('car_license_plate', { length: 20 }).unique().notNull(), // ทะเบียนรถ (unique)
  car_mileage: int('car_mileage').default(0),                                    // เลขกิโลเมตร/ไมล์ปัจจุบัน
  car_vin: varchar('car_vin', { length: 50 }).unique(),                          // เลขตัวถัง VIN (unique)
  car_engine_number: varchar('car_engine_number', { length: 50 }),               // เลขเครื่องยนต์
  fuel_type: mysqlEnum('fuel_type', ['gasoline', 'diesel', 'hybrid', 'electric']), // ประเภทเชื้อเพลิง
  transmission: mysqlEnum('transmission', ['manual', 'automatic']),              // ระบบเกียร์
  seat_count: int('seat_count'),                                                 // จำนวนที่นั่ง
  door_count: int('door_count'),                                                 // จำนวนประตู
  car_price_per_day: decimal('car_price_per_day', { precision: 10, scale: 2 }).notNull().default('0.00'), // ราคาเช่าต่อวัน
  car_deposit: decimal('car_deposit', { precision: 10, scale: 2 }).default('0.00'), // เงินประกัน/มัดจำคืน
  car_insurance_fee: decimal('car_insurance_fee', { precision: 10, scale: 2 }).default('0.00'), // ค่าประกันเพิ่ม (ถ้ามี)
  car_status: mysqlEnum('car_status', ['available', 'reserved', 'rented', 'maintenance', 'inactive']).default('available'), // สถานะรถปัจจุบัน
  car_image_cover: varchar('car_image_cover', { length: 255 }),                  // URL รูปภาพปกของรถ
  create_at_car: timestamp('create_at_car').defaultNow().notNull(),              // วันที่เพิ่มรถเข้าสู่ระบบ
});

// Car_Images – รูปภาพเพิ่มเติมของรถ
export const carImages = mysqlTable('Car_Images', {
  car_image_id: serial('car_image_id').primaryKey(),                             // รหัสรูปภาพ
  car_id: int('car_id').references(() => cars.car_id),                           // รถคันไหน
  car_image_url: varchar('car_image_url', { length: 255 }),                      // URL ของรูปภาพ
  car_image_type: mysqlEnum('car_image_type', ['front', 'back', 'left', 'right', 'interior']), // ประเภทมุมถ่าย
  uploaded_by: int('uploaded_by').references(() => users.id),                    // พนักงานที่อัปโหลด
  create_at_car_image: timestamp('create_at_car_image').defaultNow().notNull(),  // วันที่อัปโหลด
});

// Car_Documents – เอกสารรถ (ประกัน, ภาษี, พ.ร.บ. ฯลฯ)
export const carDocuments = mysqlTable('Car_Documents', {
  car_doc_id: serial('car_doc_id').primaryKey(),                                 // รหัสเอกสาร
  car_id: int('car_id').references(() => cars.car_id),                           // รถคันไหน
  car_doc_type: varchar('car_doc_type', { length: 50 }),                         // ประเภท เช่น กรมธรรม์ประกัน, ภาษีรถ, ตรวจสภาพ
  car_doc_expire: date('car_doc_expire'),                                        // วันหมดอายุเอกสาร
  car_doc_file: varchar('car_doc_file', { length: 255 }),                        // URL หรือ path ไฟล์เอกสาร
  create_at_car_doc: timestamp('create_at_car_doc').defaultNow().notNull(),      // วันที่เพิ่มเอกสาร
});

// Favorites – รายการโปรดของผู้ใช้
export const favorites = mysqlTable("Favorites", {
  favorite_id: serial("favorite_id").primaryKey(),                            // รหัสรายการโปรด

  user_id: int("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),                                                               // ผู้ใช้ที่เพิ่มรายการโปรด

  car_id: int("car_id")
    .references(() => cars.car_id, { onDelete: "cascade" })
    .notNull(),                                                               // รถที่เพิ่มรายการโปรด

  created_at: timestamp("created_at").defaultNow().notNull(),                 // วันที่เพิ่มรายการโปรด
},
  (table) => [
    uniqueIndex("unique_user_car").on(table.user_id, table.car_id),
    index("idx_favorite_user").on(table.user_id),
    index("idx_favorite_car").on(table.car_id),
  ]
);

// Promotions – โปรโมชั่นส่วนลด
export const promotions = mysqlTable('Promotions', {
  promo_id: serial('promo_id').primaryKey(),                                     // รหัสโปรโมชั่น
  promo_code: varchar('promo_code', { length: 50 }).unique(),                    // รหัสที่ลูกค้าใส่ (เช่น SUMMER25)
  discount_type: mysqlEnum('discount_type', ['percent', 'fixed']),               // ประเภทส่วนลด: เปอร์เซ็นต์หรือจำนวนตายตัว
  discount_value: decimal('discount_value', { precision: 10, scale: 2 }),        // ค่าลด (เช่น 20 หรือ 500)
  promo_start: datetime('promo_start'),                                              // วันเริ่มใช้โปร
  promo_end: datetime('promo_end'),                                                  // วันสิ้นสุดโปร
  promo_status: mysqlEnum('promo_status', ['active', 'inactive']).default('active'), // สถานะโปร
  created_by: int('created_by').references(() => users.id),                      // พนักงานที่สร้าง
  updated_by: int('updated_by').references(() => users.id),                      // พนักงานที่แก้ไขล่าสุด
  create_at_promotion: timestamp('create_at_promotion').defaultNow().notNull(),  // วันที่สร้างโปร
});

export const promotionCars = mysqlTable("Promotion_Cars", {
  id: serial("id").primaryKey(), // รหัสโปรโมชั่นรถ  

  promo_id: int("promo_id")
    .references(() => promotions.promo_id, { onDelete: "cascade" })
    .notNull(), // รหัสโปรโมชั่น

  car_id: int("car_id")
    .references(() => cars.car_id, { onDelete: "cascade" })
    .notNull(), // รหัสรถ
});

// Coupons – คูปองส่วนลด (คล้ายโปร แต่จำกัดการใช้มากกว่า)
export const coupons = mysqlTable("Coupons", {
  coupon_id: serial("coupon_id").primaryKey(),
  coupon_code: varchar("coupon_code", { length: 50 }).notNull().unique(),        // รหัสคูปอง (unique)
  coupon_image: varchar("coupon_image", { length: 255 }),                        // รูปภาพคูปอง (แสดงในแอป)
  discount_type: mysqlEnum("discount_type", ["percent", "fixed"]).notNull(),     // ประเภทส่วนลด
  discount_value: decimal("discount_value", { precision: 10, scale: 2 }).notNull(), // มูลค่าส่วนลด
  max_discount_amount: decimal("max_discount_amount", { precision: 10, scale: 2 }), // จำกัดส่วนลดสูงสุด (กรณี %)
  min_booking_amount: decimal("min_booking_amount", { precision: 10, scale: 2 }), // ยอดจองขั้นต่ำถึงใช้คูปองได้
  usage_limit: int("usage_limit"),                                               // จำนวนครั้งที่ใช้ได้ทั้งระบบ
  usage_limit_per_user: int("usage_limit_per_user").default(1),                  // จำกัดต่อคน (default 1 ครั้ง)
  used_count: int("used_count").notNull().default(0),                            // ถูกใช้ไปกี่ครั้งแล้ว
  start_date: datetime("start_date"),                                            // วันเริ่มใช้ได้
  end_date: datetime("end_date"),                                                // วันหมดอายุ
  is_active: boolean("is_active").default(false),                                // เปิดใช้งานคูปองหรือไม่
  created_by: int("created_by").references(() => users.id),                      // ผู้สร้างคูปอง
  created_at: timestamp("created_at").defaultNow().notNull(),                    // วันที่สร้าง
});

export const couponUsages = mysqlTable("Coupon_Usages", {
  usage_id: serial("usage_id").primaryKey(),
  coupon_id: int("coupon_id").references(() => coupons.coupon_id).notNull(),     // คูปองที่ใช้
  user_id: int("user_id").references(() => users.id).notNull(),                  // ผู้ใช้คูปอง
  booking_id: int("booking_id").references(() => bookings.booking_id),           // ใช้กับ booking ไหน
  used_at: timestamp("used_at").defaultNow().notNull(),                          // วันที่ใช้คูปอง
});

// Bookings – การจองและเช่ารถ (ตารางหลักที่สุด)
export const bookings = mysqlTable('Bookings', {
  booking_id: serial('booking_id').primaryKey(),
  user_id: int('user_id').references(() => users.id),                            // ผู้จอง (ลูกค้า)
  car_id: int('car_id').references(() => cars.car_id),                           // รถที่จอง
  booking_start_date: datetime('booking_start_date'),                            // วันที่เริ่มจอง (วันรับรถตามแผน)
  booking_end_date: datetime('booking_end_date'),                                // วันที่สิ้นสุดจอง (วันคืนตามแผน)
  pickup_datetime: datetime('pickup_datetime'),                                  // วันเวลาจริงที่รับรถ
  expected_return_datetime: datetime('expected_return_datetime'),                // วันเวลาที่ควรคืนรถ
  actual_return_datetime: datetime('actual_return_datetime'),                    // วันเวลาคืนรถจริง
  pickup_by: int('pickup_by').references(() => users.id),                        // พนักงานที่ทำการรับรถ
  returned_by: int('returned_by').references(() => users.id),                    // พนักงานที่รับคืนรถ
  rental_amount: decimal('rental_amount', { precision: 10, scale: 2 }).notNull(), // ค่าเช่ารถทั้งช่วง (ก่อนส่วนลด)
  deposit_amount: decimal('deposit_amount', { precision: 10, scale: 2 }).notNull(), // เงินมัดจำตอนจอง
  insurance_amount: decimal('insurance_amount', { precision: 10, scale: 2 }).notNull(), // เงินประกันความเสียหาย
  late_fee: decimal('late_fee', { precision: 10, scale: 2 }).notNull(),          // ค่าปรับคืนช้า
  cancellation_fee_amount: decimal('cancellation_fee_amount', { precision: 10, scale: 2 }).notNull().default('0.00'),  // ค่าปรับยกเลิก
  no_show_fee_amount: decimal('no_show_fee_amount', { precision: 10, scale: 2 }).notNull().default('0.00'),          // ค่าปรับไม่มา
  damage_fee: decimal('damage_fee', { precision: 10, scale: 2 }).notNull(),      // ค่าเสียหายรถ
  insurance_deducted: decimal('insurance_deducted', { precision: 10, scale: 2 }).notNull(), // เงินประกันที่ถูกหัก (ร้านยึด)
  insurance_refund_amount: decimal('insurance_refund_amount', { precision: 10, scale: 2 }).notNull(), // เงินประกันที่คืนลูกค้า
  discount_coupon: decimal('discount_coupon', { precision: 10, scale: 2 }).default('0.00'), // ส่วนลดจากคูปอง
  discount_promo: decimal('discount_promo', { precision: 10, scale: 2 }).default('0.00'), // ส่วนลดจากโปรโมชั่น
  total_discount: decimal('total_discount', { precision: 10, scale: 2 }).default('0.00'), // รวมส่วนลดทั้งหมด
  coupon_id: int('coupon_id').references(() => coupons.coupon_id),               // คูปองที่ใช้ (ถ้ามี)
  promo_id: int('promo_id').references(() => promotions.promo_id),               // โปรโมชั่นที่ใช้ (ถ้ามี)
  booking_total_price: decimal('booking_total_price', { precision: 10, scale: 2 }).notNull(), // ยอดรวมสุทธิ (หลังหักส่วนลด)
  total_paid: decimal('total_paid', { precision: 10, scale: 2 }).notNull(),      // จ่ายไปแล้วทั้งหมด
  remaining_amount: decimal('remaining_amount', { precision: 10, scale: 2 }).notNull(), // ยอดที่ยังต้องจ่าย
  contact_name: varchar('contact_name', { length: 100 }).notNull(),              // ชื่อผู้ติดต่อ (อาจต่างจาก user)
  contact_email: varchar('contact_email', { length: 100 }).notNull(),            // อีเมลผู้ติดต่อ
  contact_phone: varchar('contact_phone', { length: 20 }).notNull(),             // เบอร์ติดต่อ
  special_request: text('special_request'),                                      // คำขอพิเศษจากลูกค้า
  internal_note: text('internal_note'),                                          // หมายเหตุภายใน (พนักงานเห็นเท่านั้น)
  booking_status: mysqlEnum('booking_status', [
    'pending', 'pending_balance', 'confirmed', 'picked_up', 'returned',
    'completed', 'cancelled', 'no_show'
  ]).default('pending'),                                                         // สถานะการจองทั้งหมด
  expires_at: datetime('expires_at'),                                            // วันที่หมดอายุ
  created_at_booking: datetime('created_at_booking').default(sql`CURRENT_TIMESTAMP`), // วันที่สร้าง booking
});

// Booking Policies – นโยบายการจอง (ข้อมูลเพิ่มเติมเกี่ยวกับการจอง)
export const booking_policies = mysqlTable('booking_policies', {
  booking_policies_id: serial('booking_policies_id').primaryKey(),        // ID ของนโยบาย
  car_id: int('car_id').references(() => cars.car_id),                    // รถที่เกี่ยวข้อง
  important_notes: json('important_notes').$type<string[]>(),             // หมายเหตุสำคัญ
  business_hours: text('business_hours'),                                 // ช่วงเวลาทำการ
  after_hours_service: text('after_hours_service'),                       // บริการหลังเวลาทำการ
  payment_policy: text('payment_policy'),                                 // นโยบายการชำระเงิน
  insurance_options: text('insurance_options'),                           // ตัวเลือกประกันภัย
  extra_equipment: text('extra_equipment'),                               // อุปกรณ์เสริม
  additional_information: text('additional_information'),                 // ข้อมูลเพิ่มเติม
  created_at: timestamp('created_at').defaultNow().notNull(),             // วันที่สร้าง
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow().notNull(), // วันที่อัปเดต
});

// Checklist – เช็คลิสต์ตรวจสภาพรถก่อน-หลังเช่า
export const checklist = mysqlTable('Checklist', {
  checklist_id: serial('checklist_id').primaryKey(),
  booking_id: int('booking_id').references(() => bookings.booking_id),           // การจองที่เกี่ยวข้อง
  checklist_item: varchar('checklist_item', { length: 100 }),                    // รายการตรวจ เช่น ไฟหน้า, ยางอะไหล่, เบรก
  checklist_before: varchar('checklist_before', { length: 50 }),                 // สภาพก่อนเช่า (เช่น ดี / มีรอยเล็ก / เสีย)
  checklist_after: varchar('checklist_after', { length: 50 }),                   // สภาพหลังคืน
  checked_by: int('checked_by').references(() => users.id),                      // พนักงานที่ตรวจ
  create_at_checklist: timestamp('create_at_checklist').defaultNow().notNull(),  // วันที่ตรวจ
});

// Checklist_Images – รูปภาพประกอบเช็คลิสต์
export const checklistImages = mysqlTable('Checklist_Images', {
  check_image_id: serial('check_image_id').primaryKey(),
  booking_id: int('booking_id').references(() => bookings.booking_id),
  check_image_url: varchar('check_image_url', { length: 255 }),                  // URL รูปภาพ
  check_image_type: mysqlEnum('check_image_type', ['before', 'after']),          // ก่อนหรือหลังเช่า
  uploaded_by: int('uploaded_by').references(() => users.id),
  create_at_checklist_image: timestamp('create_at_checklist_image').defaultNow().notNull(),
});

// Extra_Charges – ค่าใช้จ่ายเพิ่มเติม (ค่าปรับ, ค่าน้ำมัน ฯลฯ)
export const extraCharges = mysqlTable('Extra_Charges', {
  extra_id: serial('extra_id').primaryKey(),
  booking_id: int('booking_id').references(() => bookings.booking_id),
  extra_type: varchar('extra_type', { length: 50 }),                             // ประเภท เช่น ค่าปรับจอดรถ, ค่าทำความสะอาด
  extra_amount: decimal('extra_amount', { precision: 10, scale: 2 }),            // จำนวนเงิน
  extra_note: varchar('extra_note', { length: 255 }),                            // หมายเหตุรายการ
  added_by: int('added_by').references(() => users.id),                          // พนักงานที่เพิ่มรายการ
  create_at_extra_charge: timestamp('create_at_extra_charge').defaultNow().notNull(),
});

// Payments – การชำระเงินทุกประเภท
export const payments = mysqlTable('Payments', {
  payment_id: serial('payment_id').primaryKey(),
  booking_id: int('booking_id').references(() => bookings.booking_id),
  user_id: int('user_id').references(() => users.id),
  payment_amount: decimal('payment_amount', { precision: 10, scale: 2 }),        // จำนวนเงินที่จ่าย
  payment_method: mysqlEnum('payment_method', ['cash', 'qr', 'credit_card']),    // วิธีชำระ
  payment_type: mysqlEnum('payment_type', ['deposit', 'full', 'insurance', 'remaining', 'extra', 'refund']).notNull(), // ประเภทการจ่าย
  payment_status: mysqlEnum('payment_status', ['paid', 'pending', 'refunded']).default('pending'), // สถานะ
  paid_at: datetime('paid_at'),                                                  // วันเวลาที่จ่ายจริง
  payment_note: varchar('payment_note', { length: 255 }).notNull(),              // หมายเหตุการจ่าย
  payment_created_by: int('payment_created_by').references(() => users.id),      // พนักงานที่บันทึก
  create_at_payment: timestamp('create_at_payment').defaultNow().notNull(),
});

// Invoices – ใบแจ้งหนี้ / ใบเสร็จ
export const invoices = mysqlTable('Invoices', {
  invoice_id: serial('invoice_id').primaryKey(),
  booking_id: int('booking_id').references(() => bookings.booking_id),
  invoice_type: mysqlEnum('invoice_type', ['invoice', 'receipt']),               // ประเภท: แจ้งหนี้ หรือ ใบเสร็จรับเงิน
  invoice_total: decimal('invoice_total', { precision: 10, scale: 2 }),          // ยอดรวมในใบ
  issue_date: datetime('issue_date'),                                            // วันที่ออกใบ
  created_by: int('created_by').references(() => users.id),                      // พนักงานที่ออกใบ
  create_at_invoice: timestamp('create_at_invoice').defaultNow().notNull(),
});

// Maintenance – การซ่อมบำรุงรถ
export const maintenance = mysqlTable('Maintenance', {
  maintenance_id: serial('maintenance_id').primaryKey(),
  car_id: int('car_id').references(() => cars.car_id),
  maintenance_detail: varchar('maintenance_detail', { length: 255 }),            // รายละเอียดการซ่อม
  maintenance_cost: decimal('maintenance_cost', { precision: 10, scale: 2 }),    // ค่าใช้จ่าย
  maintenance_date: datetime('maintenance_date'),                                // วันที่ซ่อม
  recorded_by: int('recorded_by').references(() => users.id),                    // พนักงานที่บันทึก
  created_at_maintenance: timestamp('created_at_maintenance').defaultNow().notNull(),
});

// Notifications – การแจ้งเตือนให้ผู้ใช้
export const notifications = mysqlTable("Notifications", {
  notification_id: serial("notification_id").primaryKey(),
  user_id: int("user_id").references(() => users.id).notNull(),                  // ผู้รับแจ้งเตือน
  booking_id: int("booking_id").references(() => bookings.booking_id),           // เกี่ยวกับ booking ไหน (optional)
  title: varchar("title", { length: 255 }).notNull(),                            // หัวข้อแจ้งเตือน
  message: text("message").notNull(),                                            // ข้อความแจ้งเตือน
  notif_type: mysqlEnum("notif_type", [
    "booking_created", "booking_confirmed", "pickup_reminder", "return_reminder",
    "overdue", "payment_success", "refund", "maintenance", "system"
  ]).notNull(),                                                                  // ประเภทแจ้งเตือน
  notif_priority: mysqlEnum("notif_priority", ["low", "normal", "high", "urgent"]).default("normal"), // ความสำคัญ
  is_read: boolean("is_read").default(false),                                    // อ่านแล้วหรือยัง
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Notification_Logs – บันทึกการส่งแจ้งเตือนจริง
export const notificationLogs = mysqlTable("Notification_Logs", {
  notif_id: serial("notif_id").primaryKey(),
  //  รหัส log การแจ้งเตือน (Primary Key)

  notification_id: int("notification_id"),
  //  อ้างอิง Notifications หลัก (ตัวแจ้งเตือนที่สร้างให้ผู้ใช้เห็นใน dashboard)

  user_id: int("user_id"),
  //  ผู้รับการแจ้งเตือน (ลูกค้า / แอดมิน / พนักงาน)

  booking_id: int("booking_id"),
  //  อ้างอิงการจองที่เกี่ยวข้อง (ถ้ามี เช่น จองรถ / จ่ายเงิน / คืนรถ)

  notif_type: varchar("notif_type", { length: 50 }),
  //  ประเภท event จริงที่เกิดขึ้น เช่น:
  // booking_created
  // payment_success
  // pickup_completed
  // return_completed
  // overdue

  notif_channel: mysqlEnum("notif_channel", [
    "dashboard",
    "email",
    "line",
    "sms",
    "push"
  ]).notNull(),
  //  ช่องทางที่ใช้ส่งแจ้งเตือน

  notif_status: mysqlEnum("notif_status", [
    "pending",
    "success",
    "failed"
  ]),
  // สถานะการส่ง
  // pending = รอส่ง
  // success = ส่งสำเร็จ
  // failed = ส่งไม่สำเร็จ

  notif_payload: text("notif_payload"),
  //  JSON data ที่ส่งจริง เช่น title/message/template/emailBody

  error_message: text("error_message"),
  //  เก็บ error จาก provider เช่น mail server ล่ม / line token หมดอายุ

  notif_sent_at: datetime("notif_sent_at"),
  //  เวลาที่ส่งสำเร็จจริง

  create_at_notification: timestamp("create_at_notification")
  //  เวลาที่สร้าง log record (ระบบ insert ตอนสร้างรายการ)
});

// Login_Logs – บันทึกการเข้าสู่ระบบ
export const loginLogs = mysqlTable('Login_Logs', {
  log_id: serial('log_id').primaryKey(),
  user_id: int('user_id').references(() => users.id),
  login_time: datetime('login_time').default(sql`CURRENT_TIMESTAMP`),            // เวลา login
  ip_address: varchar('ip_address', { length: 50 }),                             // IP ที่ใช้ login
  user_agent: varchar('user_agent', { length: 255 }),                            // ข้อมูล browser/device
  login_status: mysqlEnum('login_status', ['success', 'failed']).default('success'), // สำเร็จหรือล้มเหลว
});

// Action_Logs – บันทึกการกระทำสำคัญในระบบ
export const actionLogs = mysqlTable('Action_Logs', {
  action_id: serial('action_id').primaryKey(),
  user_id: int('user_id').references(() => users.id),
  action_type: varchar('action_type', { length: 100 }),                          // ประเภท เช่น create_booking, update_car_status
  action_detail: text('action_detail'),                                          // รายละเอียด (อาจเป็น JSON)
  action_time: datetime('action_time').default(sql`CURRENT_TIMESTAMP`),          // เวลาที่ทำ
  ip_address: varchar('ip_address', { length: 50 }),                             // IP ตอนทำ action
});

// Error_Logs – บันทึกข้อผิดพลาดระบบ
export const errorLogs = mysqlTable('Error_Logs', {
  error_id: serial('error_id').primaryKey(),
  user_id: int('user_id').references(() => users.id),                            // ผู้ใช้ที่ก่อ error (ถ้ามี)
  error_time: datetime('error_time').default(sql`CURRENT_TIMESTAMP`),            // เวลาที่เกิด error
  error_source: varchar('error_source', { length: 100 }),                        // ที่มา เช่น API / function ชื่ออะไร
  error_message: text('error_message'),                                          // ข้อความ error
  stack_trace: text('stack_trace'),                                              // Stack trace (ถ้ามี)
  request_data: text('request_data'),                                            // ข้อมูล request ที่ส่งมา
  severity: mysqlEnum('severity', ['low', 'medium', 'high', 'critical']).default('medium'), // ระดับความรุนแรง
  resolved: boolean('resolved').default(false),                                  // แก้ไขแล้วหรือยัง
  resolved_by: int('resolved_by').references(() => users.id),                    // ใครแก้ไข
  resolved_at: datetime('resolved_at'),                                          // วันที่แก้ไข
});


export const activities = mysqlTable('activities', {
  activities_id: int('activities_id').autoincrement().primaryKey(),                   // รหัสกิจกรรม (Primary Key)
  activities_title: varchar('activities_title', { length: 255 }).notNull(),                  // ชื่อกิจกรรม เช่น "โปรโมชันปีใหม่ 2026"
  activities_content: longtext('activities_content').notNull(),                              // เนื้อหารายละเอียดกิจกรรม
  activities_image_url: varchar('activities_image_url', { length: 500 }),                    // รูปภาพหลักของกิจกรรม
  activities_start_date: datetime('activities_start_date'),                                  // วันที่เริ่มกิจกรรม (ใช้ควบคุมการแสดงผล)
  activities_end_date: datetime('activities_end_date'),                                      // วันที่สิ้นสุดกิจกรรม (ถ้า null = ไม่กำหนดวันสิ้นสุด)
  activities_status: mysqlEnum('activities_status', ['draft', 'published', 'inactive']).notNull().default('draft'),                                                              // สถานะกิจกรรม
  // draft = ยังไม่เผยแพร่
  // published = แสดงหน้าเว็บไซต์
  // inactive = ปิดการแสดงผล (แต่ไม่ลบข้อมูล)
  activities_created_by: int('activities_created_by').notNull(),                             // ผู้สร้างกิจกรรม (user_id ของแอดมิน)
  activities_created_at: timestamp('activities_created_at').defaultNow().notNull(),          // วันที่สร้างข้อมูล
  activities_updated_at: timestamp('activities_updated_at').defaultNow().onUpdateNow().notNull(),          // วันที่อัปเดตข้อมูล
});


export const banners = mysqlTable('banners', {
  banner_id: int('banner_id').autoincrement().primaryKey(),                                   // รหัสแบนเนอร์ (Primary Key)
  banner_title: varchar('banner_title', { length: 255 }).notNull(),                           // ชื่อแบนเนอร์
  banner_content: longtext('banner_content').notNull(),                                       // เนื้อหาแบนเนอร์
  banner_image_url: varchar('banner_image_url', { length: 500 }),                             // รูปภาพแบนเนอร์
  banner_link_url: varchar('banner_link_url', { length: 500 }),                               // ลิงก์ของแบนเนอร์
  banner_link_target: mysqlEnum('banner_link_target', ['_self', '_blank']).default('_self'), // เปิดลิงก์ในหน้าต่างเดิมหรือใหม่
  banner_button_text: varchar('banner_button_text', { length: 100 }),                         // ข้อความปุ่ม
  banner_order: int('banner_order').default(0),                                               // ลำดับการแสดงผล
  banner_start_date: datetime('banner_start_date'),                                           // วันที่เริ่มแสดงผล
  banner_end_date: datetime('banner_end_date'),                                               // วันที่สิ้นสุดการแสดงผล
  banner_status: mysqlEnum('banner_status', ['draft', 'published', 'inactive'])
    .notNull()
    .default('draft'),                                                                         // สถานะของแบนเนอร์
  banner_created_by: int('banner_created_by').notNull(),                                      // ผู้สร้างแบนเนอร์
  banner_created_at: timestamp('banner_created_at').defaultNow().notNull(),                   // วันที่สร้างแบนเนอร์
  banner_updated_at: timestamp('banner_updated_at').defaultNow().onUpdateNow().notNull(),     // วันที่อัปเดตแบนเนอร์
});

export const systemSettings = mysqlTable("system_settings", {
  // =============================
  // Primary
  // =============================
  company_id: int("company_id").primaryKey(),                                 // รหัสบริษัท (Primary Key)

  // =============================
  // RENTAL SETTINGS
  // =============================
  require_id_card: boolean("require_id_card").default(true),                                 // ต้องการบัตรประชาชน
  require_driver_license: boolean("require_driver_license").default(true),                   // ต้องการใบขับขี่
  allow_extension: boolean("allow_extension").default(true),                                 // อนุญาตให้ยืมต่อ
  enforce_deposit: boolean("enforce_deposit").default(true),                                 // บังคับให้ชำระค่ามัดจำ
  full_to_full_policy: boolean("full_to_full_policy").default(true),                         // บังคับรับรถน้ำมันเต็ม และต้องคืนเต็ม

  min_renter_age: int("min_renter_age").default(18),                                         // อายุขั้นต่ำในการยืม

  default_deposit_amount: decimal("default_deposit_amount", {
    precision: 10,
    scale: 2,
  }).default("0.00"),                                                                         // เงินมัดจำเริ่มต้น

  late_fee_per_hour: decimal("late_fee_per_hour", {
    precision: 10,
    scale: 2,
  }).default("0.00"),                                                                         // ค่าปรับต่อชั่วโมง

  cancellation_fee: decimal("cancellation_fee", {
    precision: 10,
    scale: 2,
  }).default("0.00"),                                                                         // ค่าปรับการยกเลิก

  no_show_fee: decimal("no_show_fee", {
    precision: 10,
    scale: 2,
  }).default("0.00"),                                                                         // ค่าปรับไม่มา

  // =============================
  // VEHICLE SETTINGS
  // =============================
  require_pickup_photos: boolean("require_pickup_photos").default(true),                     // ต้องการถ่ายภาพก่อนยืม
  require_return_photos: boolean("require_return_photos").default(true),                     // ต้องการถ่ายภาพหลังคืน
  min_photo_count: int("min_photo_count").default(4),                                        // จำนวนรูปภาพขั้นต่ำ

  auto_approve_return: boolean("auto_approve_return").default(false),                         // อนุมัติการคืนรถอัตโนมัติ
  require_insurance: boolean("require_insurance").default(true),                             // ต้องการประกันภัย

  maintenance_alert_km: int("maintenance_alert_km").default(5000),                             // แจ้งเตือนการซ่อมบำรุง (กม.)
  insurance_alert_days: int("insurance_alert_days").default(30),                              // แจ้งเตือนประกันภัย (วัน)
  tax_alert_days: int("tax_alert_days").default(30),                                          // แจ้งเตือนภาษี (วัน)

  // =============================
  // PAYMENT SETTINGS
  // =============================
  enable_cash: boolean("enable_cash").default(true),                                         // เปิดใช้งานการชำระเงินด้วยเงินสด
  enable_credit_card: boolean("enable_credit_card").default(true),                           // เปิดใช้งานการชำระเงินด้วยบัตรเครดิต
  enable_qr_promptpay: boolean("enable_qr_promptpay").default(true),                         // เปิดใช้งานการชำระเงินด้วย QR PromptPay
  enable_bank_transfer: boolean("enable_bank_transfer").default(true),                       // เปิดใช้งานการชำระเงินด้วยการโอนเงิน

  auto_generate_invoice: boolean("auto_generate_invoice").default(true),                     // สร้างใบแจ้งหนี้อัตโนมัติ

  vat_percent: decimal("vat_percent", {
    precision: 5,
    scale: 2,
  }).default("7.00"),                                                                         // อัตราภาษีมูลค่าเพิ่ม

  // =============================
  // SECURITY SETTINGS
  // =============================
  password_min_length: int("password_min_length").default(8),                                // ความยาวขั้นต่ำของรหัสผ่าน
  max_login_attempts: int("max_login_attempts").default(5),                                  // จำนวนครั้งที่ล็อกอินผิดก่อนล็อกบัญชี
  lockout_duration_minutes: int("lockout_duration_minutes").default(30),                     // ระยะเวลาล็อกบัญชี (นาที)
  session_timeout_minutes: int("session_timeout_minutes").default(60),                       // ระยะเวลาหมดอายุเซสชัน (นาที)

  // =============================
  // SYSTEM
  // =============================
  maintenance_mode: boolean("maintenance_mode").default(false),                              // โหมดบำรุงรักษา 

  updated_at: timestamp("updated_at")
    .defaultNow()
    .onUpdateNow()
    .notNull(),
});
