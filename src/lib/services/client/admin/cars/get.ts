import type { AvailableCar } from "@/lib/type/available-car";


interface AvailableCarsParams {
  class_id?: number ;
  branch_id?: number ;
  start_date: string;
  end_date: string;
}

export interface CarDetail {
  car_id: number;
  car_brand: string;
  car_model: string;
  car_year: number | null;
  car_color: string | null;
  car_license_plate: string;
  car_status: string;
  car_mileage: number | null;
  car_vin: string | null;
  car_engine_number: string | null;
  fuel_type: string | null;
  transmission: string | null;
  seat_count: number | null;
  door_count: number | null;
  car_image_cover: string | null;
  branch_id: number | null;
  car_created_by: number;
  create_at_car: string;

  class_id: number | null;
  class_name: string | null;
  class_description: string | null;
  seats: number | null;
  base_daily_price: string;
  deposit_amount: string;

  important_notes: string | null;
  business_hours: string | null;
  after_hours_service: string | null;
  payment_policy: string | null;
  insurance_options: string | null;
  extra_equipment: string | null;
  additional_information: string | null;
}

export interface CarImage {
  car_image_id: number;
  car_id: number;
  car_image_url: string;
  car_image_type: string;
  create_at_car_image: string;
}

interface CarDetailResponse {
  success: boolean;
  car: CarDetail;
  images: CarImage[];
}

type CarWithPromotions = CarDetail & {
  promotions: {
    promo_id: number;
    promo_code: string;
    discount_type: string;
    discount_value: number;
  }[];
};
export async function getCarDetail(carId: number): Promise<CarDetailResponse> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/cars/${carId}`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("ไม่สามารถโหลดรายละเอียดรถได้");
  }

  return res.json();
}

export async function getCars(): Promise<CarWithPromotions[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/cars`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch cars");
  }

  return res.json();
}

export async function getCarById(id: number) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/cars/${id}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch car");
  }

  return res.json();
}

export async function getAvailableCars(
  params: AvailableCarsParams
): Promise<AvailableCar[]> {
  const query = new URLSearchParams();

  if (params.class_id !== undefined && params.class_id !== null) {
    query.set("class_id", params.class_id.toString());
  }

  if (params.branch_id !== undefined && params.branch_id !== null) {
    query.set("branch_id", params.branch_id.toString());
  }

  query.set("start_date", params.start_date);
  query.set("end_date", params.end_date);

  const res = await fetch(`/api/admin/cars/available?${query.toString()}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    let errorMessage = "ไม่สามารถดึงรถที่ว่างได้";
    try {
      const err = await res.json();
      errorMessage = err.message || err.error || errorMessage;
    } catch { }
    throw new Error(errorMessage);
  }

  return res.json() as Promise<AvailableCar[]>;
}
