'use client';
import { useState, useEffect, ChangeEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
    FaCar, FaFileAlt, FaImages, FaTools, FaArrowLeft, FaSave, FaTrash,
    FaUpload, FaPlus, FaExclamationTriangle, FaTimes, FaInfoCircle,
    FaWrench, FaEdit, FaCalendarAlt, FaMoneyBillWave, FaFilePdf,
} from 'react-icons/fa';
import { getBranches } from '@/lib/services/client/admin/branches/get';
import { getCarById } from '@/lib/services/client/admin/cars/get';
import { postCar } from '@/lib/services/client/admin/cars/post';
import { putCar } from '@/lib/services/client/admin/cars/put';
import { deleteCar } from '@/lib/services/client/admin/cars/delete';
import { getCarClasses } from '@/lib/services/client/admin/car_classes/get';
import { getCarImages } from '@/lib/services/client/admin/carImage/get';
import { putCarImages } from '@/lib/services/client/admin/carImage/put';
import { postCarImages } from '@/lib/services/client/admin/carImage/post';
import { deleteCarImage } from '@/lib/services/client/admin/carImage/delete';
import { getCarDocuments } from '@/lib/services/client/admin/car_documents/get';
import { postCarDocument } from '@/lib/services/client/admin/car_documents/post';
import { putCarDocument } from '@/lib/services/client/admin/car_documents/put';
import { deleteCarDocument } from '@/lib/services/client/admin/car_documents/delete';
import { getMaintenance } from '@/lib/services/client/admin/maintenance/get';
import { postMaintenance } from '@/lib/services/client/admin/maintenance/post';
import { putMaintenance } from '@/lib/services/client/admin/maintenance/put';
import { deleteMaintenance } from '@/lib/services/client/admin/maintenance/delete';
import { getPromotionCars } from '@/lib/services/client/admin/promotionCars/get';
import { postPromotionCar } from '@/lib/services/client/admin/promotionCars/post';
import { deletePromotionCar } from '@/lib/services/client/admin/promotionCars/delete';

type Tab = 'general' | 'documents' | 'images' | 'maintenance' | 'policies' | 'promotionCars';

interface CarClass { class_id: number; class_code: string; class_name: string; }
interface CarImage { car_image_id: number; car_id: number; car_image_url: string; }
interface CarDocument {
    car_doc_id: string;
    car_id: number;
    car_doc_type: 'insurance' | 'tax' | 'act' | 'other';
    car_doc_expire: string;
    car_doc_file: string | null;
}
interface MaintenanceRecord {
    maintenance_id: number;
    car_id: number;
    maintenance_detail: string;
    maintenance_cost: string;
    maintenance_date: string;
    recorded_by?: number;
}
interface ValidCarDocument extends CarDocument {
    car_doc_id: string;
    car_doc_type: 'insurance' | 'tax' | 'act' | 'other';
    car_doc_expire: string;
}
interface Branch {
    branch_id: number;
    branch_name: string;
    branch_address: string;
    branch_phone?: string | null;
}
interface PromotionCar {
    id: number;
    promo_id: number;
    promo_code: string;
    promo_type: string;
    promo_start: string;
    promo_end: string;
    promo_status: string;
    discount_value: string;
    car_id: number;
    car_brand: string;
    car_model: string;
}
interface Promotion {
    promo_id: number;
    promo_code: string;
    discount_type: string;
    discount_value: string;
    promo_start: string;
    promo_end: string;
    promo_status: string;
}

export default function CarDetailPage() {
    const { data: session } = useSession();
    const currentUserId = session?.user?.id ? Number(session.user.id) : 1;
    const params = useParams<{ car_id: string }>();
    const router = useRouter();
    const isNew = params.car_id === 'new';
    const carIdFromUrl = isNew ? null : Number(params.car_id);
    const [activeTab, setActiveTab] = useState<Tab>('general');
    const [carClasses, setCarClasses] = useState<CarClass[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [carCreated, setCarCreated] = useState(!isNew);
    const [currentCarId, setCurrentCarId] = useState<number | null>(carIdFromUrl);
    // General Form
    const [formData, setFormData] = useState({
        car_brand: '', car_model: '', car_year: '', car_color: '', car_license_plate: '',
        car_mileage: '0', car_status: 'available' as any, car_image_cover: '', class_id: '',
        car_vin: '', car_engine_number: '', fuel_type: 'gasoline', transmission: 'automatic',
        seat_count: '', door_count: '', car_price_per_day: '', car_deposit: '', car_insurance_fee: '', branch_id: '', important_notes: [] as string[], business_hours: '', after_hours_service: '', payment_policy: '', insurance_options: '', extra_equipment: '', additional_information: '',
    });
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [existingCover, setExistingCover] = useState<string | null>(null);
    // Images
    const [carImages, setCarImages] = useState<CarImage[]>([]);
    const [uploadingImages, setUploadingImages] = useState(false);
    // Documents
    const [carDocuments, setCarDocuments] = useState<ValidCarDocument[]>([]);
    const [docForm, setDocForm] = useState({
        car_doc_id: null as string | null,
        car_doc_type: 'insurance' as CarDocument['car_doc_type'],
        car_doc_expire: '',
        car_doc_file: null as File | null,
    });
    const [docUploading, setDocUploading] = useState(false);
    // Maintenance
    const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
    const [maintForm, setMaintForm] = useState({
        maintenance_id: null as number | null,
        maintenance_detail: '',
        maintenance_cost: '',
        maintenance_date: new Date().toISOString().split('T')[0],
    });
    // Promotions
    const [promotionCars, setPromotionCars] = useState<PromotionCar[]>([]);
    const [availablePromotions, setAvailablePromotions] = useState<Promotion[]>([]);
    const [selectedPromoId, setSelectedPromoId] = useState<string>('');
    const [promoLoading, setPromoLoading] = useState(false);
    const [promoError, setPromoError] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function init() {
            try {
                const [classes, branchesData] = await Promise.all([
                    getCarClasses(),
                    getBranches(),
                ]);
                setCarClasses(classes);
                setBranches(branchesData);
                if (!isNew && currentCarId) {
                    const [carRes, imagesRes, docsRes, maintRes] = await Promise.all([
                        getCarById(currentCarId),
                        getCarImages(currentCarId),
                        getCarDocuments(currentCarId),
                        getMaintenance(currentCarId),
                    ]);
                    const car = carRes.car;
                    console.log('ข้อมูลรถที่ได้จาก API:', car);
                    setFormData({
                        car_brand: car.car_brand || '',
                        car_model: car.car_model || '',
                        car_year: car.car_year ? String(car.car_year) : '',
                        car_color: car.car_color || '',
                        car_license_plate: car.car_license_plate || '',
                        car_mileage: car.car_mileage ? String(car.car_mileage) : '0',
                        car_status: car.car_status || 'available',
                        car_image_cover: car.car_image_cover || '',
                        class_id: car.class_id ? String(car.class_id) : '',
                        car_vin: car.car_vin || '',
                        car_engine_number: car.car_engine_number || '',
                        fuel_type: car.fuel_type || 'gasoline',
                        transmission: car.transmission || 'automatic',
                        seat_count: car.seat_count ? String(car.seat_count) : '',
                        door_count: car.door_count ? String(car.door_count) : '',
                        car_price_per_day: car.car_price_per_day ? String(car.car_price_per_day) : '',
                        car_deposit: car.car_deposit ? String(car.car_deposit) : '',
                        car_insurance_fee: car.car_insurance_fee ? String(car.car_insurance_fee) : '',
                        branch_id: car.branch_id ? String(car.branch_id) : '',
                        important_notes: Array.isArray(car.important_notes) ? car.important_notes : [],
                        business_hours: car.business_hours || '',
                        after_hours_service: car.after_hours_service || '',
                        payment_policy: car.payment_policy || '',
                        insurance_options: car.insurance_options || '',
                        extra_equipment: car.extra_equipment || '',
                        additional_information: car.additional_information || '',
                    });
                    setExistingCover(car.car_image_cover || null);
                    setCarImages((imagesRes?.images ?? imagesRes ?? []).filter((img: any) => Number(img.car_id) === currentCarId));
                    setCarDocuments((docsRes?.documents ?? docsRes ?? []).filter((doc: any) => Number(doc.car_id) === currentCarId));
                    setMaintenanceRecords((maintRes?.records ?? maintRes ?? []).filter((m: any) => Number(m.car_id) === currentCarId));
                    setCarCreated(true);
                }
            } catch (err: any) {
                setError(err.message || 'โหลดข้อมูลล้มเหลว');
                console.error('โหลดข้อมูลรถล้มเหลว:', err);
            } finally {
                setLoading(false);
            }
        }
        init();
    }, [currentCarId, isNew]);

    useEffect(() => {
        if (!carCreated || !currentCarId) return;

        const loadPromotions = async () => {
            setPromoLoading(true);
            setPromoError(null);
            try {
                // 1. โปรโมชั่นที่ผูกกับรถคันนี้ + active + ยังอยู่ในช่วง (BETWEEN)
                const attachedRes = await fetch(`/api/admin/promotionCars?car_id=${currentCarId}`, {
                    cache: 'no-store',
                });
                if (!attachedRes.ok) throw new Error(await attachedRes.text());
                const attachedData = await attachedRes.json();
                setPromotionCars(Array.isArray(attachedData) ? attachedData : []);

                // 2. โปรโมชั่นทั้งหมดที่ active + promo_end >= วันนี้ (รวมยังไม่เริ่ม)
                const availRes = await fetch(`/api/admin/promotionCars?scope=available`, {
                    cache: 'no-store',
                });
                if (!availRes.ok) throw new Error(await availRes.text());
                const availData = await availRes.json();
                setAvailablePromotions(availData.promotions || []);
            } catch (err: any) {
                setPromoError(err.message || 'โหลดโปรโมชั่นล้มเหลว');
                console.error(err);
            } finally {
                setPromoLoading(false);
            }
        };

        loadPromotions();
    }, [carCreated, currentCarId]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleCoverImage = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverImageFile(file);
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleUploadImages = async (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length || !currentCarId) return;
        setUploadingImages(true);
        const formData = new FormData();
        const files = Array.from(e.target.files);
        files.forEach(f => {
            formData.append('files', f);
            formData.append('types', 'front');
        });
        formData.append('car_id', String(currentCarId));
        try {
            const res = await postCarImages(formData);
            setCarImages(prev => [...prev, ...(res.images || res)]);
        } catch (err: any) {
            alert('อัปโหลดรูปไม่สำเร็จ: ' + err.message);
        } finally {
            setUploadingImages(false);
            e.target.value = '';
        }
    };

    const handleDeleteImage = async (id: number, url: string) => {
        if (!confirm('ลบรูปนี้?')) return;
        await deleteCarImage(String(id), url);
        setCarImages(prev => prev.filter(i => i.car_image_id !== id));
    };

    const handleDocChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'car_doc_file') {
            const file = (e.target as HTMLInputElement).files?.[0] ?? null;
            setDocForm(prev => ({ ...prev, car_doc_file: file }));
        } else {
            setDocForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSaveDocument = async () => {
        if (!currentCarId || !docForm.car_doc_expire) return alert('กรุณาเลือกวันหมดอายุ');
        const payload = new FormData();
        payload.append('car_id', String(currentCarId));
        payload.append('car_doc_type', docForm.car_doc_type);
        payload.append('car_doc_expire', docForm.car_doc_expire);
        if (docForm.car_doc_file) payload.append('file', docForm.car_doc_file);
        if (docForm.car_doc_id) payload.append('car_doc_id', docForm.car_doc_id);
        setDocUploading(true);
        try {
            let res: any;
            if (docForm.car_doc_id) {
                res = await putCarDocument(payload as any);
                setCarDocuments(prev => prev.map(d => d.car_doc_id === docForm.car_doc_id ? res.document : d));
            } else {
                res = await postCarDocument(payload as any);
                const updatedDocs = await getCarDocuments(currentCarId);
                setCarDocuments(updatedDocs?.documents ?? updatedDocs ?? []);
            }
            setDocForm({
                car_doc_id: null,
                car_doc_type: 'insurance',
                car_doc_expire: '',
                car_doc_file: null
            });
            const fileInput = document.querySelector('input[name="car_doc_file"]') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
            alert('บันทึกเอกสารสำเร็จ');
        } catch (err: any) {
            console.error('Error saving document:', err);
            alert('บันทึกไม่สำเร็จ: ' + err.message);
        } finally {
            setDocUploading(false);
        }
    };

    const handleSaveMaintenance = async () => {
        if (!currentCarId || !maintForm.maintenance_detail.trim() || !maintForm.maintenance_cost.trim()) {
            return alert('กรุณากรอกรายละเอียดและค่าใช้จ่าย');
        }
        const formData = new FormData();
        formData.append('car_id', String(currentCarId));
        formData.append('maintenance_detail', maintForm.maintenance_detail.trim());
        formData.append('maintenance_cost', maintForm.maintenance_cost.trim());
        formData.append('maintenance_date', `${maintForm.maintenance_date} 00:00:00`);
        formData.append('recorded_by', String(currentUserId));
        if (maintForm.maintenance_id) formData.append('maintenance_id', String(maintForm.maintenance_id));
        setSaving(true);
        try {
            let res: any;
            if (maintForm.maintenance_id) {
                res = await putMaintenance(formData);
                setMaintenanceRecords(prev => prev.map(m => m.maintenance_id === maintForm.maintenance_id ? res.record : m));
            } else {
                res = await postMaintenance(formData);
                setMaintenanceRecords(prev => [res.record, ...prev]);
            }
            setMaintForm({
                maintenance_id: null,
                maintenance_detail: '',
                maintenance_cost: '',
                maintenance_date: new Date().toISOString().split('T')[0],
            });
            alert('บันทึกสำเร็จ');
        } catch (err: any) {
            alert('บันทึกล้มเหลว: ' + (err.message || 'เกิดข้อผิดพลาด'));
        } finally {
            setSaving(false);
        }
    };

    const handleEditMaintenance = (r: MaintenanceRecord) => {
        setMaintForm({
            maintenance_id: r.maintenance_id,
            maintenance_detail: r.maintenance_detail,
            maintenance_cost: String(r.maintenance_cost),
            maintenance_date: r.maintenance_date.split('T')[0],
        });
    };

    const handleDeleteMaintenance = async (maintenanceId: number) => {
        if (!confirm('ลบรายการบำรุงรักษานี้?')) return;
        setSaving(true);
        try {
            await deleteMaintenance(String(maintenanceId));
            setMaintenanceRecords(prev => prev.filter(m => m.maintenance_id !== maintenanceId));
            alert('ลบรายการสำเร็จ');
        } catch (err: any) {
            alert('ลบรายการไม่สำเร็จ: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEditDocument = (doc: CarDocument) => {
        setDocForm({
            car_doc_id: doc.car_doc_id,
            car_doc_type: doc.car_doc_type,
            car_doc_expire: doc.car_doc_expire.split('T')[0],
            car_doc_file: null,
        });
    };

    const handleDeleteDocument = async (docId: string) => {
        if (!confirm('ลบเอกสารนี้?')) return;
        try {
            await deleteCarDocument(docId);
            setCarDocuments(prev => prev.filter(d => d.car_doc_id !== docId));
            alert('ลบเอกสารสำเร็จ');
        } catch (err: any) {
            alert('ลบเอกสารไม่สำเร็จ: ' + err.message);
        }
    };

    const handleDeleteCar = async () => {
        if (!currentCarId) return;
        const confirmText = `คุณแน่ใจหรือไม่ว่าต้องการลบรถ ${formData.car_license_plate}?\n\nการดำเนินการนี้จะลบข้อมูลทั้งหมดรวมถึง:\n- รูปภาพทั้งหมด\n- เอกสารทั้งหมด\n- ประวัติการบำรุงรักษา\n\nและไม่สามารถกู้คืนได้!`;
        if (!confirm(confirmText)) return;
        setSaving(true);
        try {
            await deleteCar(String(currentCarId));
            alert('ลบรถสำเร็จ');
            router.push('/admin/cars');
        } catch (err: any) {
            alert('ลบรถไม่สำเร็จ: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleMaintChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setMaintForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveGeneral = async () => {
        if (!formData.car_brand.trim() || !formData.car_model.trim() || !formData.car_license_plate.trim()) {
            return alert('กรุณากรอกยี่ห้อ รุ่น และทะเบียน');
        }
        if (!confirm(isNew ? 'เพิ่มรถใหม่และไปต่อกับเอกสาร/รูปภาพ/การบำรุงรักษา?' : 'บันทึกการเปลี่ยนแปลง?')) return;
        setSaving(true);
        const payload = new FormData();
        Object.entries(formData).forEach(([k, v]) => {
            if (v !== '' && v !== null && v !== undefined) payload.append(k, String(v));
        });
        if (coverImageFile) payload.append('file', coverImageFile);
        try {
            if (isNew) {
                const res = await postCar(payload);
                console.log("Response จาก postCar:", res);
                let newCarId: number | null = null;
                if (res && typeof res === 'object') {
                    if (res.car && res.car.car_id) {
                        newCarId = res.car.car_id;
                    } else if (res.car_id) {
                        newCarId = res.car_id;
                    }
                }
                if (!newCarId) {
                    throw new Error("API ไม่ส่ง car_id กลับมา");
                }
                setCurrentCarId(newCarId);
                setCarCreated(true);
                router.replace(`/admin/cars/${newCarId}`, { scroll: false });
                if (res.car?.car_image_cover) {
                    setExistingCover(res.car.car_image_cover);
                } else if (res.car_image_cover) {
                    setExistingCover(res.car_image_cover);
                }
                setCoverPreview(null);
                setCoverImageFile(null);
                alert('เพิ่มรถสำเร็จ! คุณสามารถเพิ่มเอกสาร รูปภาพ และประวัติการบำรุงรักษาได้แล้ว');
            } else {
                await putCar(currentCarId!, payload);
                setCoverImageFile(null);
                setCoverPreview(null);
                alert('บันทึกสำเร็จ');
            }
        } catch (err: any) {
            console.error("Error จากการบันทึก:", err);
            alert('บันทึกไม่สำเร็จ: ' + (err.message || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์'));
        } finally {
            setSaving(false);
        }
    };

    const handleAddPromotion = async () => {
        if (!selectedPromoId) return alert('กรุณาเลือกโปรโมชั่นก่อน');
        if (!confirm('เพิ่มโปรโมชั่นนี้ให้รถคันนี้หรือไม่?')) return;

        try {
            const res = await fetch('/api/admin/promotionCars', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    promo_id: Number(selectedPromoId),
                    car_id: currentCarId,
                }),
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText || 'เพิ่มโปรโมชั่นไม่สำเร็จ');
            }

            const refreshed = await fetch(`/api/admin/promotionCars?car_id=${currentCarId}`).then(r => r.json());
            setPromotionCars(Array.isArray(refreshed) ? refreshed : []);
            setSelectedPromoId('');
            alert('เพิ่มโปรโมชั่นสำเร็จ');
        } catch (err: any) {
            alert(err.message || 'เกิดข้อผิดพลาด');
        }
    };

    const handleRemovePromotion = async (id: number) => {
        if (!confirm('ต้องการลบโปรโมชั่นนี้ออกจากรถคันนี้หรือไม่?')) return;

        try {
            const res = await fetch(`/api/admin/promotionCars/${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                throw new Error(await res.text() || 'ลบไม่สำเร็จ');
            }

            setPromotionCars(prev => prev.filter(p => p.id !== id));
            alert('ลบโปรโมชั่นสำเร็จ');
        } catch (err: any) {
            alert('ลบไม่สำเร็จ: ' + (err.message || 'เกิดข้อผิดพลาด'));
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-lg">กำลังโหลด...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-600 text-lg">{error}</div>;

    const canAccessOtherTabs = carCreated && !!currentCarId;

    return (
        <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white rounded-xl shadow border overflow-hidden">
                    <div className="px-6 py-5 border-b bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                                    <FaCar size={28} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        {isNew && !carCreated ? 'เพิ่มรถใหม่' : `รถ ${formData.car_license_plate || '—'}`}
                                    </h1>
                                    <p className="text-gray-600 mt-1">
                                        {formData.car_brand} {formData.car_model} {formData.car_year && `(${formData.car_year})`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => router.back()}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    <FaArrowLeft className="inline mr-2" /> กลับ
                                </button>
                                {carCreated && (
                                    <button
                                        onClick={handleDeleteCar}
                                        className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition"
                                    >
                                        <FaTrash className="inline mr-2" /> ลบรถ
                                    </button>
                                )}
                                <button
                                    onClick={handleSaveGeneral}
                                    disabled={saving}
                                    className={`px-6 py-2 rounded-lg text-white font-medium flex items-center gap-2 transition ${saving ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                                >
                                    <FaSave />
                                    {saving ? 'กำลังบันทึก...' : (isNew && !carCreated ? 'เพิ่มรถ' : 'บันทึก')}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex border-b overflow-x-auto bg-gray-50">
                        {[
                            { id: 'general', label: 'ข้อมูลหลัก', icon: FaInfoCircle, disabled: false },
                            { id: 'documents', label: 'เอกสาร', icon: FaFileAlt, disabled: !canAccessOtherTabs },
                            { id: 'images', label: 'รูปภาพ', icon: FaImages, disabled: !canAccessOtherTabs },
                            { id: 'maintenance', label: 'บำรุงรักษา', icon: FaWrench, disabled: !canAccessOtherTabs },
                            { id: 'policies', label: 'นโยบายการจอง', icon: FaFileAlt, disabled: !canAccessOtherTabs },
                            { id: 'promotionCars', label: 'โปรโมชั่น', icon: FaFileAlt, disabled: !canAccessOtherTabs },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    if (tab.disabled) {
                                        alert("กรุณาบันทึกข้อมูลรถหลักก่อน จึงจะจัดการเอกสาร รูปภาพ หรือประวัติการบำรุงรักษาได้");
                                        return;
                                    }
                                    setActiveTab(tab.id as Tab);
                                }}
                                disabled={tab.disabled}
                                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                                    ${activeTab === tab.id
                                        ? 'border-blue-600 text-blue-700 bg-white'
                                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'}
                                    ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
                {/* Main Content */}
                <div className="bg-white rounded-xl shadow border p-6 lg:p-8 space-y-10">
                    {(activeTab === 'general' || (isNew && !carCreated)) && (
                        <section className="space-y-8">
                            <h2 className="text-xl font-semibold flex items-center gap-3 text-gray-800">
                                <FaInfoCircle className="text-blue-600" /> ข้อมูลรถหลัก
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ยี่ห้อ <span className="text-red-500 text-[16px]">*</span></label>
                                    <input name="car_brand" value={formData.car_brand} id="car_brand" onChange={handleChange} className="block w-full border border-gray-300 p-4 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">รุ่น <span className="text-red-500 text-[16px]">*</span></label>
                                    <input name="car_model" value={formData.car_model} id="car_model" onChange={handleChange} className="block w-full border border-gray-300 p-4 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ปีรถ <span className="text-red-500 text-[16px]">*</span></label>
                                    <input name="car_year" value={formData.car_year} id="car_year" onChange={handleChange} type="number" min="1900" max={new Date().getFullYear() + 1} className="block w-full border border-gray-300 p-4 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">สี <span className="text-red-500 text-[16px]">*</span></label>
                                    <input name="car_color" value={formData.car_color} id="car_color" onChange={handleChange} className="block w-full border border-gray-300 p-4 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">เลขทะเบียน <span className="text-red-500 text-[16px]">*</span></label>
                                    <input name="car_license_plate" value={formData.car_license_plate} id="car_license_plate" onChange={handleChange} className="block w-full border border-gray-300 p-4 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm uppercase" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">เลขไมล์ (กม.) <span className="text-red-500 text-[16px]">*</span></label>
                                    <input name="car_mileage" value={formData.car_mileage} id="car_mileage" onChange={handleChange} type="number" min="0" className="block w-full border border-gray-300 p-4 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">เลขตัวถัง (VIN) <span className="text-red-500 text-[16px]">*</span></label>
                                    <input name="car_vin" value={formData.car_vin} id="car_vin" onChange={handleChange} className="block w-full border border-gray-300 p-4 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">เลขเครื่องยนต์ <span className="text-red-500 text-[16px]">*</span></label>
                                    <input name="car_engine_number" value={formData.car_engine_number} id="car_engine_number" onChange={handleChange} className="block w-full border border-gray-300 p-4 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทน้ำมัน <span className="text-red-500 text-[16px]">*</span></label>
                                    <select name="fuel_type" value={formData.fuel_type} id="fuel_type" onChange={handleChange} className="block w-full border border-gray-300 p-4 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                                        <option value="gasoline">เบนซิน</option>
                                        <option value="diesel">ดีเซล</option>
                                        <option value="hybrid">ไฮบริด</option>
                                        <option value="electric">ไฟฟ้า</option>
                                        <option value="other">อื่นๆ</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">เกียร์ <span className="text-red-500 text-[16px]">*</span></label>
                                    <select name="transmission" value={formData.transmission} id="transmission" onChange={handleChange} className="block w-full border border-gray-300 p-4 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                                        <option value="manual">เกียร์ธรรมดา</option>
                                        <option value="automatic">เกียร์อัตโนมัติ</option>
                                        <option value="cvt">CVT</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนที่นั่ง <span className="text-red-500 text-[16px]">*</span></label>
                                    <input name="seat_count" value={formData.seat_count} id="seat_count" onChange={handleChange} type="number" min="2" max="20" className="block w-full border border-gray-300 p-4 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนประตู <span className="text-red-500 text-[16px]">*</span></label>
                                    <input name="door_count" value={formData.door_count} id="door_count" onChange={handleChange} type="number" min="2" max="6" className="block w-full border border-gray-300 p-4 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        ราคาเช่าต่อวัน (บาท) <span className="text-red-500 text-[16px]">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="car_price_per_day"
                                        value={formData.car_price_per_day || ''}
                                        onChange={handleChange}
                                        min="0"
                                        step="0.01"
                                        className="block w-full border border-gray-300 p-4 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        เงินมัดจำ (บาท) <span className="text-red-500 text-[16px]">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="car_deposit"
                                        value={formData.car_deposit || ''}
                                        onChange={handleChange}
                                        min="0"
                                        step="0.01"
                                        className="block w-full border border-gray-300 p-4 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        ค่าประกัน (บาท) <span className="text-red-500 text-[16px]">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="car_insurance_fee"
                                        value={formData.car_insurance_fee || ''}
                                        onChange={handleChange}
                                        min="0"
                                        step="0.01"
                                        className="block w-full border border-gray-300 p-4 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทรถ</label>
                                    <select name="class_id" value={formData.class_id} id="class_id" onChange={handleChange} className="block w-full border border-gray-300 p-4 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                                        <option value="">— เลือกประเภท —</option>
                                        {carClasses.map(cls => (
                                            <option key={cls.class_id} value={cls.class_id}>
                                                {cls.class_name} ({cls.class_code})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        สาขาที่รถสังกัด <span className="text-red-500 text-[16px]">*</span>
                                    </label>
                                    <select
                                        name="branch_id"
                                        value={formData.branch_id}
                                        onChange={handleChange}
                                        className="block w-full border border-gray-300 p-4 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        required
                                    >
                                        <option value="">— เลือกสาขา —</option>
                                        {branches.map((branch) => (
                                            <option key={branch.branch_id} value={branch.branch_id}>
                                                {branch.branch_name}
                                                {branch.branch_phone && ` (${branch.branch_phone})`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">สถานะรถ</label>
                                    <select name="car_status" value={formData.car_status} onChange={handleChange} className="block w-full border border-gray-300 p-4 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                                        <option value="available">พร้อมใช้งาน</option>
                                        <option value="maintenance">กำลังซ่อมบำรุง</option>
                                        <option value="unavailable">ไม่พร้อมใช้งาน</option>
                                        <option value="reserved">จองไว้</option>
                                        <option value="sold">ขายแล้ว</option>
                                    </select>
                                </div>
                            </div>
                            {/* Cover Image */}
                            <div className="pt-4 border-t">
                                <label className="block text-sm font-medium text-gray-700 mb-2">รูปภาพปก (Cover)</label>
                                <div className="flex flex-col sm:flex-row gap-6 items-start">
                                    {(coverPreview || existingCover) && (
                                        <div className="relative">
                                            <img
                                                src={coverPreview || existingCover!}
                                                alt="รถปก"
                                                className="w-64 h-40 object-cover rounded-lg border shadow-sm"
                                            />
                                            {coverPreview && (
                                                <button
                                                    onClick={() => { setCoverPreview(null); setCoverImageFile(null); }}
                                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600"
                                                >
                                                    <FaTimes size={14} />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    <label className="cursor-pointer">
                                        <input type="file" accept="image/*" onChange={handleCoverImage} className="hidden" />
                                        <div className={`w-64 h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center p-4 transition ${coverPreview ? 'border-green-400 text-green-600' : 'border-blue-400 text-blue-500 hover:bg-blue-50'}`}>
                                            <FaUpload className="text-3xl mb-2" />
                                            <span className="text-sm font-medium">{coverPreview ? 'เปลี่ยนรูปปก' : 'เลือกภาพปก'}</span>
                                            <span className="text-xs text-gray-500 mt-1">ไฟล์ .jpg .png สูงสุด 5MB</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </section>
                    )}
                    {activeTab === 'images' && canAccessOtherTabs && (
                        <section className="space-y-8">
                            <h2 className="text-xl font-semibold flex items-center gap-3 text-gray-800">
                                <FaImages className="text-indigo-600" /> รูปภาพรถทั้งหมด
                            </h2>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-indigo-400 transition">
                                <label className="cursor-pointer">
                                    <input type="file" multiple accept="image/*" onChange={handleUploadImages} disabled={uploadingImages} className="hidden" />
                                    <div className="space-y-3">
                                        <FaPlus className="mx-auto text-5xl text-indigo-400" />
                                        <p className="text-lg font-medium text-gray-700">
                                            {uploadingImages ? 'กำลังอัปโหลด...' : 'คลิกหรือลากวางเพื่ออัปโหลดรูปภาพ (หลายรูปได้)'}
                                        </p>
                                        <p className="text-sm text-gray-500">รองรับ JPG, PNG — ขนาดไม่เกิน 10MB ต่อรูป</p>
                                    </div>
                                </label>
                            </div>
                            {carImages.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {carImages.map(img => (
                                        <div key={img.car_image_id} className="group relative rounded-lg overflow-hidden shadow-sm border hover:shadow-md transition">
                                            <img src={img.car_image_url} alt={`รถ ${formData.car_license_plate}`} className="w-full h-44 object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-4">
                                                <button onClick={() => handleDeleteImage(img.car_image_id, img.car_image_url)} className="p-3 bg-white rounded-full hover:bg-red-100">
                                                    <FaTrash className="text-red-600" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 text-gray-500">ยังไม่มีรูปภาพของรถคันนี้</div>
                            )}
                        </section>
                    )}
                    {activeTab === 'documents' && canAccessOtherTabs && (
                        <section className="space-y-8">
                            <h2 className="text-xl font-semibold flex items-center gap-3 text-gray-800">
                                <FaFileAlt className="text-purple-600" /> เอกสารรถ
                            </h2>
                            <div className="bg-gray-50 p-6 rounded-xl border space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทเอกสาร</label>
                                        <select name="car_doc_type" value={docForm.car_doc_type} onChange={handleDocChange} className="block p-4 border border-gray-300 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                                            <option value="insurance">ประกันภัย</option>
                                            <option value="tax">ภาษี</option>
                                            <option value="act">พ.ร.บ.</option>
                                            <option value="other">เอกสารอื่นๆ</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">วันหมดอายุ</label>
                                        <input type="date" name="car_doc_expire" value={docForm.car_doc_expire} onChange={handleDocChange} className="block p-4 border border-gray-300 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">ไฟล์เอกสาร</label>
                                        <input type="file" name="car_doc_file" onChange={handleDocChange} className="block p-4 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3">
                                    {docForm.car_doc_id && (
                                        <button type="button" onClick={() => setDocForm({ car_doc_id: null, car_doc_type: 'insurance', car_doc_expire: '', car_doc_file: null })} className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition">
                                            ยกเลิก
                                        </button>
                                    )}
                                    <button type="button" onClick={handleSaveDocument} disabled={docUploading} className={`px-6 py-2 rounded-md text-white font-medium ${docUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} transition`}>
                                        {docForm.car_doc_id ? 'อัปเดตเอกสาร' : 'เพิ่มเอกสาร'}
                                    </button>
                                </div>
                            </div>
                            {carDocuments.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ประเภท</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">หมดอายุ</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ไฟล์</th>
                                                <th className="px-6 py-3 text-right"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {carDocuments
                                                .filter(doc => doc)
                                                .map(doc => (
                                                    <tr key={doc.car_doc_id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                                                            {doc.car_doc_type === 'insurance'
                                                                ? 'ประกันภัย'
                                                                : doc.car_doc_type === 'tax'
                                                                    ? 'ภาษี'
                                                                    : doc.car_doc_type === 'act'
                                                                        ? 'พ.ร.บ.'
                                                                        : 'อื่นๆ'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {doc.car_doc_expire
                                                                ? new Date(doc.car_doc_expire).toLocaleDateString('th-TH')
                                                                : '-'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                            {doc.car_doc_file ? (
                                                                <a
                                                                    href={doc.car_doc_file}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 hover:underline flex items-center gap-1"
                                                                >
                                                                    <FaFilePdf className="inline" /> ดูไฟล์
                                                                </a>
                                                            ) : '-'}
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-sm font-medium space-x-4">
                                                            <button
                                                                onClick={() => handleEditDocument(doc)}
                                                                className="text-indigo-600 hover:text-indigo-900"
                                                            >
                                                                <FaEdit />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteDocument(doc.car_doc_id)}
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-16 text-gray-500 border border-dashed rounded-xl">ยังไม่มีเอกสารที่อัปโหลด</div>
                            )}
                        </section>
                    )}
                    {activeTab === 'maintenance' && canAccessOtherTabs && (
                        <section className="space-y-8">
                            <h2 className="text-xl font-semibold flex items-center gap-3 text-gray-800">
                                <FaWrench className="text-green-600" /> ประวัติการบำรุงรักษา / ซ่อมแซม
                            </h2>
                            <div className="bg-gray-50 p-6 rounded-xl border space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                                    <div className="md:col-span-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียดการซ่อม / บำรุงรักษา</label>
                                        <textarea name="maintenance_detail" value={maintForm.maintenance_detail} onChange={handleMaintChange} rows={3} placeholder="เช่น เปลี่ยนถ่ายน้ำมันเครื่องและกรองน้ำมัน, เปลี่ยนผ้าเบรกหน้า..." className="block p-4 border border-gray-300 w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm" />
                                    </div>
                                    <div className="space-y-4 md:col-span-2">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">วันที่</label>
                                            <input type="date" name="maintenance_date" value={maintForm.maintenance_date} onChange={handleMaintChange} className="block p-4 border border-gray-300 w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">ค่าใช้จ่าย (บาท)</label>
                                            <input type="number" name="maintenance_cost" value={maintForm.maintenance_cost} onChange={handleMaintChange} min="0" step="1" className="block p-4 border border-gray-300 w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3">
                                    {maintForm.maintenance_id && (
                                        <button type="button" onClick={() => setMaintForm({ maintenance_id: null, maintenance_detail: '', maintenance_cost: '', maintenance_date: new Date().toISOString().split('T')[0] })} className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition">
                                            ยกเลิก
                                        </button>
                                    )}
                                    <button type="button" onClick={handleSaveMaintenance} className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition font-medium">
                                        {maintForm.maintenance_id ? 'อัปเดต' : 'บันทึก'}รายการ
                                    </button>
                                </div>
                            </div>
                            {maintenanceRecords.length > 0 ? (
                                <div className="space-y-4">
                                    {maintenanceRecords
                                        .sort((a, b) => new Date(b.maintenance_date).getTime() - new Date(a.maintenance_date).getTime())
                                        .map(record => (
                                            <div key={record.maintenance_id} className="border rounded-lg p-5 hover:shadow-md transition bg-white">
                                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900">{record.maintenance_detail}</p>
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            วันที่: {new Date(record.maintenance_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                        </p>
                                                    </div>
                                                    <div className="text-right min-w-[140px]">
                                                        <p className="text-xl font-semibold text-green-600">฿{Number(record.maintenance_cost).toLocaleString('th-TH')}</p>
                                                        <div className="mt-3 space-x-4 text-sm">
                                                            <button onClick={() => handleEditMaintenance(record)} className="text-indigo-600 hover:text-indigo-800 font-medium">แก้ไข</button>
                                                            <button onClick={() => handleDeleteMaintenance(record.maintenance_id)} className="text-red-600 hover:text-red-800 font-medium">ลบ</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 text-gray-500 border border-dashed rounded-xl">ยังไม่มีประวัติการบำรุงรักษา</div>
                            )}
                        </section>
                    )}
                    {activeTab === 'policies' && (
                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">นโยบายการจอง</h2>
                            </div>
                            <div className="">
                                <div className=' pb-4'>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        หมายเหตุสำคัญ
                                    </label>
                                    <div className="space-y-3">
                                        {Array.isArray(formData.important_notes) &&
                                            formData.important_notes.length > 0 ? (
                                            formData.important_notes.map((note, index) => (
                                                <div key={index} className="flex gap-2 items-start">
                                                    <textarea
                                                        value={note}
                                                        onChange={(e) => {
                                                            const updatedNotes = [...formData.important_notes];
                                                            updatedNotes[index] = e.target.value;
                                                            setFormData({ ...formData, important_notes: updatedNotes });
                                                        }}
                                                        className="flex-1 border border-gray-300 p-3 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                                        rows={2}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const updatedNotes = formData.important_notes.filter(
                                                                (_, i) => i !== index
                                                            );
                                                            setFormData({ ...formData, important_notes: updatedNotes });
                                                        }}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        ลบ
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-400 italic">-</p>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setFormData({
                                                ...formData,
                                                important_notes: [...formData.important_notes, ""],
                                            })
                                        }
                                        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                    >
                                        + เพิ่มข้อใหม่
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ช่วงเวลาทำการ</label>
                                    <textarea name="business_hours" value={formData.business_hours} id="business_hours" onChange={handleChange} className="block w-full border border-gray-300 p-4 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" rows={4} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">บริการหลังเวลาทำการ</label>
                                    <textarea name="after_hours_service" value={formData.after_hours_service} id="after_hours_service" onChange={handleChange} className="block w-full border border-gray-300 p-4 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" rows={4} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">นโยบายการชำระเงิน</label>
                                    <textarea name="payment_policy" value={formData.payment_policy} id="payment_policy" onChange={handleChange} className="block w-full border border-gray-300 p-4 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" rows={4} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ตัวเลือกประกันภัย</label>
                                    <textarea name="insurance_options" value={formData.insurance_options} id="insurance_options" onChange={handleChange} className="block w-full border border-gray-300 p-4 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" rows={4} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">อุปกรณ์เสริม</label>
                                    <textarea name="extra_equipment" value={formData.extra_equipment} id="extra_equipment" onChange={handleChange} className="block w-full border border-gray-300 p-4 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" rows={4} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ข้อมูลเพิ่มเติม</label>
                                    <textarea name="additional_information" value={formData.additional_information} id="additional_information" onChange={handleChange} className="block w-full border border-gray-300 p-4 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" rows={4} />
                                </div>
                            </div>
                        </section>
                    )}
                    {activeTab === 'promotionCars' && canAccessOtherTabs && (
                        <section className="space-y-8">
                            <h2 className="text-2xl font-bold text-gray-900">
                                โปรโมชั่นที่ใช้กับรถนี้ ({formData.car_license_plate || '—'})
                            </h2>

                            {promoError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                                    {promoError}
                                </div>
                            )}

                            {promoLoading ? (
                                <div className="text-center py-10 text-gray-600">
                                    กำลังโหลดโปรโมชั่น...
                                </div>
                            ) : (
                                <>
                                    {/* ส่วนเลือกและเพิ่มโปรโมชั่น */}
                                    <div className="bg-gray-50 p-6 rounded-xl border space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                            <div className="md:col-span-3">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    เลือกโปรโมชั่น (active + ยังไม่หมดอายุ)
                                                </label>
                                                <select
                                                    value={selectedPromoId}
                                                    onChange={(e) => setSelectedPromoId(e.target.value)}
                                                    className="block w-full border border-gray-300 p-3 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                >
                                                    <option value="">— เลือกโปรโมชั่น —</option>
                                                    {availablePromotions.map((promo) => {
                                                        const isFuture = new Date(promo.promo_start) > new Date();
                                                        return (
                                                            <option key={promo.promo_id} value={promo.promo_id}>
                                                                {promo.promo_code} — {promo.discount_value}
                                                                {promo.discount_type === 'percent' ? '%' : ' บาท'}
                                                                {' '}
                                                                (เริ่ม {new Date(promo.promo_start).toLocaleDateString('th-TH')} –
                                                                สิ้นสุด {new Date(promo.promo_end).toLocaleDateString('th-TH')})
                                                                {isFuture && ' (ยังไม่เริ่ม)'}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                            </div>
                                            <button
                                                onClick={handleAddPromotion}
                                                disabled={!selectedPromoId || promoLoading}
                                                className={`px-6 py-3 rounded-lg text-white font-medium transition ${selectedPromoId && !promoLoading
                                                    ? 'bg-green-600 hover:bg-green-700'
                                                    : 'bg-gray-400 cursor-not-allowed'
                                                    }`}
                                            >
                                                + เพิ่มโปรโมชั่น
                                            </button>
                                        </div>
                                    </div>

                                    {/* รายการโปรโมชั่นที่ผูกแล้ว */}
                                    {promotionCars.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {promotionCars.map((pc) => {
                                                const isFuture = new Date(pc.promo_start) > new Date();
                                                const isActive = !isFuture && new Date(pc.promo_end) >= new Date();

                                                return (
                                                    <div
                                                        key={pc.id}
                                                        className={`bg-white border rounded-lg p-5 shadow-sm hover:shadow-md transition ${isFuture ? 'border-orange-300 bg-orange-50' : ''}`}
                                                    >
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div>
                                                                <h3 className="text-lg font-semibold">{pc.promo_code}</h3>
                                                                <p className="text-sm text-gray-600 mt-1">
                                                                    {pc.discount_value}{pc.promo_type === 'percent' ? '%' : ' บาท'}
                                                                </p>
                                                            </div>
                                                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${isFuture ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                                                                }`}>
                                                                {isFuture ? 'รอเริ่มใช้งาน' : 'กำลังใช้งาน'}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 mb-4">
                                                            ช่วงเวลา: {new Date(pc.promo_start).toLocaleDateString('th-TH')} –{' '}
                                                            {new Date(pc.promo_end).toLocaleDateString('th-TH')}
                                                            {isFuture && ' (ยังไม่เริ่ม)'}
                                                        </p>
                                                        <button
                                                            onClick={() => handleRemovePromotion(pc.id)}
                                                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                        >
                                                            ลบโปรโมชั่นนี้ออกจากรถ
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-gray-500 border border-dashed rounded-xl bg-gray-50">
                                            ยังไม่มีโปรโมชั่นที่ใช้งานได้ผูกกับรถคันนี้
                                        </div>
                                    )}
                                </>
                            )}
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}