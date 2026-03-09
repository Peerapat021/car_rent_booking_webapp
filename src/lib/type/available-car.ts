export interface AvailableCar {
  car_id: number;
  branch_id: number | null;        
  car_brand: string;
  car_model: string;
  car_license_plate: string;
  car_year: number | null;
  car_color: string | null;
  class_name: string;
  car_price_per_day: string;
  car_deposit: string | null;     
  car_insurance_fee: string | null; 
  car_image_cover: string | null;  
}