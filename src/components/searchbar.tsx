"use client";

import React, { useState, useRef, useEffect } from "react";
import {Clock, Filter } from "lucide-react";
import { BsCalendarWeek } from "react-icons/bs";
import { FaChevronDown, FaChevronRight, FaStar } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import { IoMdSearch } from "react-icons/io";
import { getBranches } from "@/lib/services/client/branches/get";
import { getCities } from "@/lib/services/client/cities/get";
import { t } from "i18next";


interface City {
  city_id: number;
  city_name: string;
  city_status: "active" | "inactive";
}

const normalizeDate = (date: Date): Date => {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
};

export default function Searchbar() {
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [selectedBranches, setSelectedBranches] = useState<string>("");
  const [expandedCityId, setExpandedCityId] = useState<number | null>(null);
  const [ProvinceError, setProvinceError] = useState<string | null>(null);

  const [branches, setBranches] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);

  const [cities, setCities] = useState<City[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);

  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [autoExpandedOnFocus, setAutoExpandedOnFocus] = useState(false);

  const getNextHalfHour = () => {
    const now = new Date();
    const minutes = now.getMinutes();
    const hours = now.getHours();
    if (minutes < 30) {
      return `${hours.toString().padStart(2, "0")}:30`;
    } else {
      const nextHour = (hours + 1) % 24;
      return `${nextHour.toString().padStart(2, "0")}:00`;
    }
  };

  const [pickupDate, setPickupDate] = useState<Date>(new Date());
  const [returnDate, setReturnDate] = useState<Date>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });
  const [pickupTime, setPickupTime] = useState(getNextHalfHour());
  const [returnTime, setReturnTime] = useState(getNextHalfHour());

  const [showPickupTimeDropdown, setShowPickupTimeDropdown] = useState(false);
  const [showReturnTimeDropdown, setShowReturnTimeDropdown] = useState(false);

  const [showPickupCalendar, setShowPickupCalendar] = useState(false);
  const [showReturnCalendar, setShowReturnCalendar] = useState(false);
  const [pickupMonth, setPickupMonth] = useState(new Date());
  const [returnMonth, setReturnMonth] = useState(new Date());

  const [showSortModal, setShowSortModal] = useState(false);
  const [fadeSortModal, setFadeSortModal] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [selectedSort, setSelectedSort] = useState("รถเช่าแนะนำ");

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [fadeFilter, setFadeFilter] = useState(false);
  const [filterCategory, setFilterCategory] = useState("ประเภทรถ");
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterSeat, setFilterSeat] = useState("");
  const [priceRange, setPriceRange] = useState([1000, 999999]);
  const [offer, setOffer] = useState("");
  const [filterPayment, setFilterPayment] = useState("");
  const [showFilterSortDropdown, setShowFilterSortDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const [dropdownWidth, setDropdownWidth] = useState(0);
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedData = localStorage.getItem("SearchData");
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setSearchInput(data.location || "");
        setSelectedBranches(data.selectedProvince || "");
        // ถ้าต้องการเอาวันที่และเวลาด้วย
        // setPickupDate(new Date(data.pickupDate));
        // setReturnDate(new Date(data.returnDate));
        // setPickupTime(data.pickupTime || getNextHalfHour());
        // setReturnTime(data.returnTime || getNextHalfHour());
      } catch (e) {
        console.error("Error parsing saved search data", e);
      }
    }
  }, []);

  const hasSearched = () => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("SearchPerformed");
  };

  const formatThaiDate = (date: Date) => {
    const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const thaiDays = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = (date.getFullYear() + 543).toString().slice(-2);
    const dayOfWeek = thaiDays[date.getDay()];
    return { day, month, year, dayOfWeek };
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const timeStr = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
        times.push(timeStr);
      }
    }
    return times;
  };
  const timeOptions = generateTimeOptions();

  const isTimeInPast = (time: string, date: Date) => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    if (!isToday) return false;
    const [hours, minutes] = time.split(":").map(Number);
    const timeDate = new Date(today);
    timeDate.setHours(hours, minutes, 0, 0);
    return timeDate < today;
  };

  const getAvailablePickupTimes = () => {
    return timeOptions.filter((time) => !isTimeInPast(time, pickupDate));
  };

  const getAvailableReturnTimes = () => {
    const isSameDay = pickupDate.toDateString() === returnDate.toDateString();
    if (isSameDay) {
      return timeOptions.filter((time) => {
        if (isTimeInPast(time, returnDate)) return false;
        return time > pickupTime;
      });
    }
    return timeOptions.filter((time) => !isTimeInPast(time, returnDate));
  };

  useEffect(() => {
    if (!inputRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
        if (inputRef.current) {
          setDropdownWidth(inputRef.current.offsetWidth);
        }
      });
    resizeObserver.observe(inputRef.current);
    setDropdownWidth(inputRef.current.offsetWidth);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoadingCities(true);
        setLoadingBranches(true);
        const [citiesData, branchesData] = await Promise.all([
          getCities(),
          getBranches(),
        ]);

        const activeCities = (citiesData || []).filter(
          (city: City) => city.city_status === "active"
        );

        setCities(activeCities);
        setFilteredCities(activeCities);
        setBranches(branchesData || []);
      } catch (err) {
        console.error("Error fetching cities:", err);
        setCities([]);
        setBranches([]);
      } finally {
        setLoadingCities(false);
        setLoadingBranches(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (!searchInput.trim()) {
      setFilteredCities(cities);
      return;
    }

    const term = searchInput.toLowerCase().trim().split(">")[0].trim();

    const matchingCities = cities.filter((city: City) =>
      (city.city_name || "").toLowerCase().includes(term)
    );

    const branchesMatching = branches.filter((branch) =>
      (branch.branch_name || "").toLowerCase().includes(term)
    );

    const cityIdsFromBranches = new Set(branchesMatching.map((b) => b.city_id));

    const citiesFromBranches = cities.filter((city: City) =>
      cityIdsFromBranches.has(city.city_id)
    );

    const cityMap = new Map<number, City>();
    [...matchingCities, ...citiesFromBranches].forEach((city) => {
      cityMap.set(city.city_id, city);
    });

    let finalResults = Array.from(cityMap.values());

    const cityNamePart = searchInput.split(">")[0]?.trim().toLowerCase();
    if (cityNamePart) {
      const priorityCity = cities.find(
        (c: City) => (c.city_name || "").toLowerCase().trim() === cityNamePart
      );
      if (priorityCity && !finalResults.some((c) => c.city_id === priorityCity.city_id)) {
        finalResults = [priorityCity, ...finalResults];
      }
    }

    setFilteredCities(finalResults);
  }, [searchInput, cities, branches]);

  const parseLocationInput = (input: string) => {
    if (!input.includes(">")) return { cityPart: input.trim(), branchPart: "" };
    const [city, branch] = input.split(">").map((part) => part.trim());
    return { cityPart: city || "", branchPart: branch || "" };
  };

  const handleInputFocus = () => {
    setShowLocationDropdown(true);
    setProvinceError(null);
    setIsEditingLocation(true);
    if (autoExpandedOnFocus) return;

    const { cityPart } = parseLocationInput(searchInput);
    if (!cityPart) return;

    let matchedCity = cities.find(
      (c) => (c.city_name || "").trim().toLowerCase() === cityPart.toLowerCase()
    );

    if (!matchedCity) {
      matchedCity = cities.find((c) =>
        (c.city_name || "").toLowerCase().includes(cityPart.toLowerCase())
      );
    }

    if (matchedCity) {
      const hasBranches = branches.some((b) => b.city_id === matchedCity.city_id);
      if (hasBranches) {
        setExpandedCityId(matchedCity.city_id);
        setAutoExpandedOnFocus(true);
      }
    }
  };

  useEffect(() => {
    if (expandedCityId !== null) {
      const related = branches.filter((b) => b.city_id === expandedCityId);
      console.log(`Branches for city ${expandedCityId}:`, related);
    }
  }, [expandedCityId, branches]);

  const openSortModal = () => {
    setShowSortModal(true);
    setTimeout(() => setFadeSortModal(true), 100);
  };
  const openFilterModal = () => {
    setShowFilterModal(true);
    setTimeout(() => setFadeFilter(true), 100);
  };
  const closeSortModal = () => {
    setFadeSortModal(false);
    setTimeout(() => setShowSortModal(false), 300);
  };
  const closeFilterModal = () => {
    setFadeFilter(false);
    setTimeout(() => setShowFilterModal(false), 300);
  };
  const handleSortSelect = (option: string) => {
    setSelectedSort(option);
    closeSortModal();
  };

  const sortOptions = ["รถเช่าแนะนำ", "ราคาต่ำที่สุด", "ราคาสูงที่สุด", "คะแนนรีวิวสูงที่สุด", "ใกล้ที่สุด"];
  const categories = ["รถเก๋ง", "รถกระบะ", "รถตู้"];
  const seats = ["ดี", "ปานกลาง", "ดีเยี่ยม"];

  const applyFilters = () => {
    setFadeFilter(false);
    setTimeout(() => setShowFilterModal(false), 300);
  };

  const resetFilters = () => {
    setSelectedSort("รถเช่าแนะนำ");
    setFilterCategory("ประเภทรถ");
    setFilterRating(null);
    setFilterSeat("");
    setPriceRange([1000, 999999]);
    setOffer("");
    setFilterPayment("");
  };

  const renderCalendar = (
    currentMonth: Date,
    selectedDate: Date,
    onDateSelect: (date: Date) => void,
    onMonthChange: (month: Date) => void
  ) => {
    const { firstDay, daysInMonth } = getDaysInMonth(currentMonth);
    const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isSelected = date.toDateString() === selectedDate.toDateString();
      const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
      days.push(
        <button
          key={day}
          onClick={() => !isPast && onDateSelect(date)}
          disabled={isPast}
          className={`h-8 flex items-center justify-center rounded-full text-sm transition-colors
            ${isSelected ? "bg-(--blue-primary) text-(--white)" : ""}
            ${!isSelected && !isPast ? "hover:bg-gray-100 cursor-pointer" : ""}
            ${isPast ? "text-gray-300 cursor-not-allowed" : ""}
          `}
        >
          {day}
        </button>
      );
    }

    return (
      <div className="p-3">
        <div className="flex justify-between items-center mb-3">
          <button
            onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <FaChevronDown className="rotate-90" size={14} />
          </button>
          <span className="text-sm font-medium">
            {thaiMonths[currentMonth.getMonth()]} {currentMonth.getFullYear() + 543}
          </span>
          <button
            onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <FaChevronDown className="-rotate-90" size={14} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
          <div>อา</div><div>จ</div><div>อ</div><div>พ</div><div>พฤ</div><div>ศ</div><div>ส</div>
        </div>
        <div className="grid grid-cols-7 gap-1">{days}</div>
      </div>
    );
  };

  const handleSearch = () => {
    setProvinceError(null);
    if (!selectedBranches.trim() && !searchInput.trim()) {
      setProvinceError("กรุณาเลือกสถานที่");
      return;
    }
    setShowPickupCalendar(false);
    setShowReturnCalendar(false);
    setShowPickupTimeDropdown(false);
    setShowReturnTimeDropdown(false);
    setIsEditingLocation(false);

    const searchData = {
      location: searchInput.trim(),
      selectedBranches: selectedBranches.trim(),
      pickupDate: pickupDate.toISOString(),
      pickupTime,
      returnDate: returnDate.toISOString(),
      returnTime,
      timestamp: Date.now(),
    };
    console.log("searchdata ",searchData)
    localStorage.setItem("SearchData", JSON.stringify(searchData));
    localStorage.setItem("SearchPerformed", "true");
    window.location.reload();
  };

  return (
    <>
      <div className="mt-5 sm:mt-20 py-4 px-3 sm:px-0 relative flex flex-col items-start sm:items-center">

        {/* label */}
        <div className="mb-2 text-sm sm:text-base w-full sm:max-w-xl lg:max-w-2xl">
          <p className="text-sm sm:text-base">
            ค้นหาตามจังหวัด
          </p>
        </div>

        <div className="w-full sm:max-w-xl lg:max-w-2xl">
          <div className="flex items-center gap-2">
            <div ref={inputRef} className="relative w-full">
            {hasSearched() && (
              <button
                onClick={() => {
                  localStorage.removeItem('BookingSummary');
                  localStorage.removeItem("SearchData");
                  localStorage.removeItem("SearchPerformed");
                  window.location.reload();
                  setSearchInput("");
                  setSelectedBranches("");
                  setProvinceError(null);
                }}
                className="absolute right-12 top-1/2 -translate-y-1/2 
                  hover:text-gray-700 transition-colors p-1 cursor-pointer"
                title="ล้างการค้นหา"
              >
                <RxCross2 size={20} />
              </button>
            )}
            {hasSearched() && (
              <button
                // onClick={handleSearch}
              >
                <IoMdSearch
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-(--orange-primary) cursor-pointer"
                  size={20}
                />
              </button>
            )}
            <input
              type="text"
              placeholder="ค้นหาสถานที่รับรถ"
              value={searchInput}
              onChange={(e) => {
                const value = e.target.value;
                setSearchInput(value);
                setShowLocationDropdown(true);
                setProvinceError(null);
                if (!value.includes(">") || value.trim().length < 4) {
                  setAutoExpandedOnFocus(false);
                  setExpandedCityId(null);
                }
              }}
              onFocus={handleInputFocus}
              className={`w-full py-3 px-4 sm:px-5 pr-12 rounded-md shadow-[0_2px_12px_rgba(0,0,0,0.1)] outline-none text-sm sm:text-base border ${
                ProvinceError ? "border-red-500 focus:ring-red-500" : "border-transparent"
              }`}
            />
            {!hasSearched() && (
              <button
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                onClick={() => setShowLocationDropdown(!showLocationDropdown)}
              >
                <FaChevronDown
                  className={`transition-transform duration-300 ${showLocationDropdown ? "rotate-180" : ""}`}
                />
              </button>
            )}
          </div>
          {/* filter btn */}
          {hasSearched() && !isEditingLocation && (
            <button
              className="shrink-0 cursor-pointer text-(--orange-primary) hover:text-orange-700 transition-colors p-1"
              onClick={openFilterModal}
            >
              <Filter size={20} />
            </button>
          )}
          </div>
        </div>

        {ProvinceError && (
          <p className="mt-1.5 text-sm text-red-500 w-full sm:max-w-xl lg:max-w-2xl">
            {ProvinceError}
          </p>
        )}

        {/* ── location dropdown ── */}
        {showLocationDropdown && (
          <div
            className="absolute bg-(--white) rounded-md shadow-xl z-20 max-h-[35vh] overflow-y-auto overscroll-contain divide-y divide-gray-100"
            style={{
              width: `${dropdownWidth}px`,
              left: inputRef.current?.offsetLeft || 0,
              top: inputRef.current
                ? inputRef.current.offsetTop + inputRef.current.offsetHeight
                : 0,
            }}
          >
            {loadingCities ? (
              <div className="px-5 py-8 text-center text-sm">กำลังโหลด...</div>
            ) : filteredCities.length === 0 ? (
              <div className="p-5 text-center text-sm border-t">ไม่พบสถานที่ "{searchInput}"</div>
            ) : (
              filteredCities.map((cities : City) => {
                const cityId = cities.city_id;
                const citiesDisplayName =
                  cities.city_name || "สาขาไม่ระบุชื่อ";

                const relatedBranches = branches.filter((b) => b.city_id === cityId);
                return (
                  <div key={cityId} className="border-b first:border-t last:border-b-0">
                    <button
                      className="w-full text-left px-4 py-3 flex justify-between items-center hover:bg-gray-50 transition-colors text-sm sm:text-base cursor-pointer"
                      onClick={() => {
                        setExpandedCityId(expandedCityId === cityId ? null : cityId);
                      }}
                    >
                      {citiesDisplayName}
                      {relatedBranches.length > 0 && (
                        <FaChevronDown
                          className={`transition-transform duration-300 ${
                            expandedCityId === cityId ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </button>
                    {expandedCityId === cityId && (
                      <div>
                        {loadingBranches ?(
                          <div className="px-8 py-3 text-sm">กำลังโหลดสาขา...</div>
                        ): relatedBranches.length === 0 ? (
                          <div className="px-8 py-3 text-sm border-t">ไม่มีสาขาในจังหวัดนี้</div>
                        ) : (
                          relatedBranches.map((branch) => (
                            <button
                              key={branch.branch_id}
                              className="block w-full border-t text-left px-6 sm:px-8 py-2 hover:bg-gray-50 transition-colors text-sm cursor-pointer"
                              onClick={() => {
                                const displayName = `${citiesDisplayName}>${branch.branch_name}`;
                                setSearchInput(displayName);
                                setSelectedBranches(branch.branch_name);
                                setShowLocationDropdown(false);
                                setExpandedCityId(null);
                                setProvinceError(null);
                              }}
                            >
                              {`>${branch.branch_name}`}
                            </button>
                            
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* datetime */}
        {isEditingLocation || !hasSearched() ? (
          <div className="mt-4 bg-(--white) rounded-lg sm:shadow-[0_2px_12px_rgba(0,0,0,0.1)] w-full sm:max-w-xl lg:max-w-2xl">
            <div className="sm:p-4">
              {/* date */}
              <div className="mb-4 rounded-lg shadow-[0_2px_12px_rgba(0,0,0,0.1)] sm:shadow-md">
                <div className="p-3 sm:p-4 flex flex-row gap-3 sm:gap-0">
                  {/* Pickup Date */}
                  <div className="flex-1 sm:pr-4 border-r-2 relative min-h-24 sm:min-h-0">
                    <div className="flex items-center p-1 sm:p-0 gap-2 mb-2">
                      <BsCalendarWeek className="w-5 h-5 md:w-6 md:h-6 text-(--blue-primary)" />
                      <span className="text-xs sm:text-sm md:text-base">วันที่รับรถ</span>
                    </div>
                    <div className="flex flex-col justify-center items-center sm:items-start">
                      <button
                        onClick={() => {
                          setShowPickupCalendar(!showPickupCalendar);
                          setShowReturnCalendar(false);
                        }}
                        className="flex items-baseline gap-1 cursor-pointer hover:opacity-80"
                      >
                        <span className="text-5xl sm:text-6xl text-(--blue-primary)">
                          {formatThaiDate(pickupDate).day}
                        </span>
                        <span className="text-xs sm:text-sm ">
                          {formatThaiDate(pickupDate).dayOfWeek} {formatThaiDate(pickupDate).month}{" "}
                          {formatThaiDate(pickupDate).year}
                        </span>
                      </button>
                    </div>
                    {showPickupCalendar && (
                      <div className="absolute left-0 top-full mt-2 bg-(--white) rounded-lg shadow-xl z-50 w-64">
                        {renderCalendar(
                          pickupMonth,
                          pickupDate,
                          (date) => {
                            setPickupDate(date);
                            if (date > returnDate) {
                              const nextDay = new Date(date.getTime() + 86400000);
                              setReturnDate(nextDay);
                            }
                            const today = new Date();
                            if (date.toDateString() === today.toDateString()) {
                              const availableTimes = timeOptions.filter(
                                (time) => !isTimeInPast(time, date)
                              );
                              if (availableTimes.length > 0 && isTimeInPast(pickupTime, date)) {
                                setPickupTime(availableTimes[0]);
                              }
                            }
                            if (
                              date.toDateString() === returnDate.toDateString() &&
                              returnTime <= pickupTime
                            ) {
                              const laterTimes = timeOptions.filter(
                                (t) => t > pickupTime && !isTimeInPast(t, date)
                              );
                              if (laterTimes.length > 0) {
                                setReturnTime(laterTimes[0]);
                              }
                            }
                            setShowPickupCalendar(false);
                          },
                          setPickupMonth
                        )}
                      </div>
                    )}
                  </div>
                  {/* Return Date */}
                  <div className="flex-1 sm:pl-4 relative">
                    <div className="flex items-center p-1 sm:p-0 gap-2 mb-2">
                      <BsCalendarWeek className="w-5 h-5 md:w-6 md:h-6 text-(--blue-primary)" />
                      <span className="text-xs sm:text-sm md:text-base">วันที่คืนรถ</span>
                    </div>
                    <div className="flex flex-col justify-center items-center sm:items-start">
                      <button
                        onClick={() => {
                          setShowReturnCalendar(!showReturnCalendar);
                          setShowPickupCalendar(false);
                        }}
                        className="flex items-baseline gap-1 cursor-pointer hover:opacity-80"
                      >
                        <span className="text-5xl sm:text-6xl text-(--blue-primary)">
                          {formatThaiDate(returnDate).day}
                        </span>
                        <span className="text-xs sm:text-sm">
                          {formatThaiDate(returnDate).dayOfWeek} {formatThaiDate(returnDate).month}{" "}
                          {formatThaiDate(returnDate).year}
                        </span>
                      </button>
                    </div>
                    {showReturnCalendar && (
                      <div className="absolute right-0 top-full mt-2 bg-(--white) rounded-lg shadow-xl z-50 w-64">
                        {renderCalendar(
                          returnMonth,
                          returnDate,
                          (date) => {
                            if (date >= pickupDate) {
                              const normalized = normalizeDate(date);
                              setReturnDate(normalized);
                              const today = new Date();
                              if (date.toDateString() === today.toDateString()) {
                                const availableTimes = timeOptions.filter(
                                  (time) => !isTimeInPast(time, date)
                                );
                                if (availableTimes.length > 0 && isTimeInPast(returnTime, date)) {
                                  setReturnTime(availableTimes[0]);
                                }
                              }
                              if (
                                date.toDateString() === pickupDate.toDateString() &&
                                returnTime <= pickupTime
                              ) {
                                const laterTimes = timeOptions.filter(
                                  (t) => t > pickupTime && !isTimeInPast(t, date)
                                );
                                if (laterTimes.length > 0) {
                                  setReturnTime(laterTimes[0]);
                                }
                              }
                            }
                            setShowReturnCalendar(false);
                          },
                          setReturnMonth
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* time */}
              <div className="mb-4 rounded-lg shadow-[0_2px_12px_rgba(0,0,0,0.1)] sm:shadow-md">
                <div className="p-3 sm:p-4 flex flex-row gap-3 sm:gap-0">
                  {/* Pickup Time */}
                  <div className="flex flex-1 items-start gap-3 sm:pr-4 border-r-2 relative">
                    <Clock className="w-7 h-7 md:w-8 md:h-8 text-(--blue-primary) mt-1" />
                    <div className="flex flex-col w-full">
                      <span className="text-xs sm:text-sm md:text-base mb-1">เวลารับรถ</span>
                      <button
                        onClick={() => {
                          setShowPickupTimeDropdown(!showPickupTimeDropdown);
                          setShowReturnTimeDropdown(false);
                        }}
                        className="text-base sm:text-xl text-(--blue-primary) text-left cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        {pickupTime}
                      </button>
                      {showPickupTimeDropdown && (
                        <div className="absolute left-0 top-full mt-1 bg-(--white) rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto w-24 border">
                          {getAvailablePickupTimes().map((time) => (
                            <button
                              key={time}
                              onClick={() => {
                                setPickupTime(time);
                                if (
                                  pickupDate.toDateString() === returnDate.toDateString() &&
                                  returnTime <= time
                                ) {
                                  const availableReturnTimes = timeOptions.filter((t) => t > time);
                                  if (availableReturnTimes.length > 0) {
                                    setReturnTime(availableReturnTimes[0]);
                                  }
                                }
                                setShowPickupTimeDropdown(false);
                              }}
                              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${
                                pickupTime === time ? "bg-blue-50 text-(--blue-primary) font-medium" : ""
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Return Time */}
                  <div className="flex flex-1 items-start gap-3 sm:pl-4 relative">
                    <Clock className="w-7 h-7 md:w-8 md:h-8 text-(--blue-primary) mt-1" />
                    <div className="flex flex-col w-full">
                      <span className="text-xs sm:text-sm md:text-base mb-1">เวลาคืนรถ</span>
                      <button
                        onClick={() => {
                          setShowReturnTimeDropdown(!showReturnTimeDropdown);
                          setShowPickupTimeDropdown(false);
                        }}
                        className="text-base sm:text-xl text-(--blue-primary) text-left cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        {returnTime}
                      </button>
                      {showReturnTimeDropdown && (
                        <div className="absolute left-0 top-full mt-1 bg-(--white) rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto w-24 border">
                          {getAvailableReturnTimes().map((time) => (
                            <button
                              key={time}
                              onClick={() => {
                                setReturnTime(time);
                                setShowReturnTimeDropdown(false);
                              }}
                              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${
                                returnTime === time ? "bg-blue-50 text-(--blue-primary) font-medium" : ""
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* search button */}
              <button
                onClick={handleSearch}
                className="w-full bg-(--blue-primary) hover:bg-blue-700 text-base sm:text-lg md:text-xl text-(--white) py-3 rounded-md cursor-pointer transition-colors shadow-md"
              >
                ค้นหารถ
              </button>
            </div>
          </div>
        ) : (
          /* sort  */
          <div className="flex items-center gap-2 sm:gap-3 justify-start sm:justify-end w-full sm:max-w-xl lg:max-w-2xl mt-4">
            {/* sort */}
            <div className="relative">
              {/* sort mobile */}
              <button
                onClick={openSortModal}
                className="sm:hidden flex items-center gap-2 bg-(--blue-primary) hover:bg-blue-700 text-(--white) text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-full cursor-pointer transition-colors whitespace-nowrap"
              >
                <span>{selectedSort}</span>
                <FaChevronDown />
              </button>
              {/* sort desktop */}
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="hidden sm:flex items-center gap-2 bg-(--blue-primary) hover:bg-blue-700 text-(--white) text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-full cursor-pointer transition-colors whitespace-nowrap"
              >
                <span className="hidden sm:inline">{selectedSort}</span>
                <span className="sm:hidden">เรียง</span>
                <FaChevronDown
                  className={`transition-transform duration-300 ${showSortDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {/* sort modal mobile */}
              {showSortModal && (
                <div className="sm:hidden fixed inset-0 flex items-center justify-center z-50 px-10">
                  <div
                    className={`fixed inset-0 bg-(--gray-dark) transition-opacity duration-300 ${
                      fadeSortModal ? "opacity-50" : "opacity-0"
                    }`}
                  ></div>
                  <div
                    className={`relative bg-(--white) rounded-md w-full max-w-md shadow-2xl transform transition-all duration-300 ${
                      fadeSortModal ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                    }`}
                  >
                    <div className="py-6">
                      <div className="relative px-6">
                        <button
                          onClick={closeSortModal}
                          className="absolute right-4 -top-6 cursor-pointer border rounded-full p-0.5 text-(--white) bg-(--gray-light)"
                        >
                          <RxCross2 size={15} />
                        </button>
                        <h3 className="text-lg font-semibold text-center my-4">เรียงตาม</h3>
                      </div>
                      <ul className="space-y-1">
                        {sortOptions.map((option, id) => (
                          <li key={id}>
                            <button
                              onClick={() => handleSortSelect(option)}
                              className={`w-full flex justify-between items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors cursor-pointer ${
                                selectedSort === option ? "text-(--orange-primary)" : ""
                              }`}
                            >
                              {option}
                              <span className={selectedSort === option ? "text-(--orange-primary)" : ""}>
                                <FaChevronRight size={10} />
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* sort dropdown desktop */}
              {showSortDropdown && (
                <div className="absolute right-0 w-48 sm:w-56 bg-(--white) rounded-lg shadow-xl z-30">
                  <div className="px-4 py-3 text-center font-semibold text-sm sm:text-base">
                    เรียงตาม
                  </div>
                  <ul>
                    {sortOptions.map((option, id) => (
                      <li key={id}>
                        <button
                          onClick={() => {
                            setSelectedSort(option);
                            setShowSortDropdown(false);
                          }}
                          className={`w-full flex justify-between items-center px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors cursor-pointer ${
                            selectedSort === option ? "text-(--orange-primary)" : ""
                          }`}
                        >
                          {option}
                          {selectedSort === option && (
                            <span className="text-(--orange-primary) text-lg">
                              <FaChevronRight size={10} />
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* filter modal */}
      {showFilterModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 sm:p-4">
          <div
            className={`fixed inset-0 bg-(--gray-dark) opacity-50 sm:transition-opacity sm:duration-300 ${
              fadeFilter ? "sm:opacity-50" : "sm:opacity-0"
            }`}
            onClick={closeFilterModal}
          ></div>
          <div
            className={`relative bg-(--white) rounded-none sm:rounded-lg w-full h-full sm:h-auto sm:max-w-md sm:max-h-[90vh] flex flex-col justify-between overflow-y-auto shadow-2xl opacity-100 translate-y-0 sm:transform sm:transition-all sm:duration-300 ${
              fadeFilter ? "sm:opacity-100 sm:translate-y-0" : "sm:opacity-0 sm:translate-y-6"
            }`}
          >
            <div className="mt-6 space-y-4">
              {/* เรียงตาม */}
              <div className="px-4">
                <p className="text-sm sm:text-base mb-2">เรียงตาม</p>
                <div className="relative">
                  <button
                    onClick={() => setShowFilterSortDropdown(!showFilterSortDropdown)}
                    className="w-full px-3 py-2 border rounded-lg flex items-center justify-between text-sm sm:text-base cursor-pointer transition-colors"
                  >
                    <span>{selectedSort}</span>
                    <FaChevronDown
                      className={`transition-transform duration-300 ${showFilterSortDropdown ? "rotate-180" : ""}`}
                    />
                  </button>
                  {showFilterSortDropdown && (
                    <div className="absolute left-0 right-0 mt-1 bg-(--white) rounded-lg shadow-xl z-31">
                      <ul>
                        {sortOptions.map((option, id) => (
                          <li key={id}>
                            <button
                              onClick={() => {
                                setSelectedSort(option);
                                setShowFilterSortDropdown(false);
                              }}
                              className={`w-full flex justify-between items-center px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors cursor-pointer ${
                                selectedSort === option ? "text-(--orange-primary)" : ""
                              }`}
                            >
                              {option}
                              {selectedSort === option && (
                                <span className="text-(--orange-primary)">
                                  <FaChevronRight size={10} />
                                </span>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* ประเภทรถ */}
              <div className="px-4">
                <p className="text-sm sm:text-base mb-2">ประเภทรถ</p>
                <div className="relative">
                  <button
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className="w-full px-3 py-2 border rounded-lg flex items-center justify-between text-sm sm:text-base cursor-pointer transition-colors"
                  >
                    <span>{filterCategory}</span>
                    <FaChevronDown
                      className={`transition-transform duration-300 ${showCategoryDropdown ? "rotate-180" : ""}`}
                    />
                  </button>
                  {showCategoryDropdown && (
                    <div className="absolute left-0 right-0 mt-1 bg-(--white) rounded-lg shadow-lg z-30">
                      <ul>
                        {categories.map((cat, id) => (
                          <li key={id}>
                            <button
                              onClick={() => {
                                setFilterCategory(cat);
                                setShowCategoryDropdown(false);
                              }}
                              className={`w-full flex justify-between items-center px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors cursor-pointer ${
                                filterCategory === cat ? "text-(--orange-primary)" : ""
                              }`}
                            >
                              {cat}
                              {filterCategory === cat && (
                                <span className="text-(--orange-primary)">
                                  <FaChevronRight size={10} />
                                </span>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* ระดับดาว */}
              <div className="px-4">
                <p className="text-sm sm:text-base mb-2">ระดับดาว</p>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setFilterRating(filterRating === star ? null : star)}
                      className={`flex-1 p-3 border rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer text-sm sm:text-base ${
                        filterRating === star
                          ? "bg-(--orange-primary) text-(--white)"
                          : "bg-(--white) hover:bg-gray-100"
                      }`}
                    >
                      {star}
                      <FaStar className={filterRating === star ? "text-(--white)" : "text-(--orange-primary)"} />
                    </button>
                  ))}
                </div>
              </div>

              {/* คะแนนรีวิว */}
              <div className="px-4">
                <p className="text-sm sm:text-base mb-2">คะแนนรีวิว</p>
                <div className="flex gap-2">
                  {seats.map((seat, id) => (
                    <button
                      key={id}
                      onClick={() => setFilterSeat(filterSeat === seat ? "" : seat)}
                      className={`flex-1 p-3 border rounded-lg transition-colors cursor-pointer text-sm sm:text-base ${
                        filterSeat === seat
                          ? "bg-(--orange-primary) text-(--white)"
                          : "bg-(--white) hover:bg-gray-100"
                      }`}
                    >
                      {seat}
                    </button>
                  ))}
                </div>
              </div>

              {/* ช่วงราคา */}
              <div className="px-4">
                <p className="text-sm sm:text-base mb-3">ช่วงราคา</p>
                <div className="flex justify-between text-sm sm:text-base mb-5">
                  <span>฿{priceRange[0].toLocaleString()}</span>
                  <span>฿{priceRange[1].toLocaleString()}</span>
                </div>
                <div className="relative h-8">
                  <input
                    type="range" min="1000" max="999999" step="1000" value={priceRange[0]}
                    onChange={(e) => {
                      const newMin = Math.min(Number(e.target.value), priceRange[1] - 1000);
                      setPriceRange([newMin, priceRange[1]]);
                    }}
                    className="absolute w-full h-2 bg-transparent pointer-events-none appearance-none z-20 slider-min"
                  />
                  <input
                    type="range" min="1000" max="999999" step="1000" value={priceRange[1]}
                    onChange={(e) => {
                      const newMax = Math.max(Number(e.target.value), priceRange[0] + 1000);
                      setPriceRange([priceRange[0], newMax]);
                    }}
                    className="absolute w-full h-2 bg-transparent pointer-events-none appearance-none z-30 slider-max"
                  />
                  <div className="absolute w-full h-2 bg-gray-200 rounded-full top-3" />
                  <div
                    className="absolute h-2 bg-(--blue-primary) rounded-full top-3"
                    style={{
                      left: `${((priceRange[0] - 1000) / (999999 - 1000)) * 100}%`,
                      right: `${100 - ((priceRange[1] - 1000) / (999999 - 1000)) * 100}%`,
                    }}
                  />
                </div>
                <style jsx>{`
                  input[type="range"].slider-min::-webkit-slider-thumb,
                  [type="range"].slider-max::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    height: 28px;
                    width: 28px;
                    border-radius: 50%;
                    background: var(--white);
                    border: 1px solid var(--blue-primary);
                    cursor: pointer;
                    pointer-events: auto;
                    margin-top: 20px;
                  }
                `}</style>
              </div>

              {/* ข้อเสนอของที่พัก */}
              <div className="px-4">
                <p className="text-sm sm:text-base mb-2">ข้อเสนอของที่พัก</p>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setOffer(offer === "offer" ? "" : "offer")}
                      className={`p-3 border rounded-lg text-left text-sm sm:text-base transition-colors cursor-pointer ${
                        offer === "offer"
                          ? "bg-(--orange-primary) text-(--white)"
                          : "bg-(--white) hover:bg-gray-100"
                      }`}
                    >
                      รวมอาหารเช้า
                    </button>
                  </div>
                </div>
              </div>

              {/* การชำระเงิน */}
              <div className="px-4">
                <p className="text-sm sm:text-base mb-2">การชำระเงิน</p>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilterPayment(filterPayment === "pickup" ? "" : "pickup")}
                      className={`p-3 border rounded-lg text-left text-sm sm:text-base transition-colors cursor-pointer ${
                        filterPayment === "pickup"
                          ? "bg-(--orange-primary) text-(--white)"
                          : "bg-(--white) hover:bg-gray-100"
                      }`}
                    >
                      ชำระเงินวันรับรถ
                    </button>
                    <button
                      onClick={() => setFilterPayment(filterPayment === "instant" ? "" : "instant")}
                      className={`p-3 border rounded-lg text-left text-sm sm:text-base transition-colors cursor-pointer ${
                        filterPayment === "instant"
                          ? "bg-(--orange-primary) text-(--white)"
                          : "bg-(--white) hover:bg-gray-100"
                      }`}
                    >
                      จ่ายทันที
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilterPayment(filterPayment === "nocard" ? "" : "nocard")}
                      className={`p-3 border rounded-lg text-left text-sm sm:text-base transition-colors cursor-pointer ${
                        filterPayment === "nocard"
                          ? "bg-(--orange-primary) text-(--white)"
                          : "bg-(--white) hover:bg-gray-100"
                      }`}
                    >
                      ไม่ต้องใช้บัตรเครดิตในการจอง
                    </button>
                    <button
                      onClick={() => setFilterPayment(filterPayment === "freecancel" ? "" : "freecancel")}
                      className={`p-3 border rounded-lg text-left text-sm sm:text-base transition-colors cursor-pointer ${
                        filterPayment === "freecancel"
                          ? "bg-(--orange-primary) text-(--white)"
                          : "bg-(--white) hover:bg-gray-100"
                      }`}
                    >
                      ยกเลิกการจองฟรี
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* btn ล้างและกรอง */}
            <div className="flex mt-7 gap-2 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
              <button
                onClick={resetFilters}
                className="flex-2 sm:flex-1 p-3 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors text-sm sm:text-base cursor-pointer"
              >
                ล้าง
              </button>
              <button
                onClick={applyFilters}
                className="flex-8 sm:flex-1 p-3 bg-(--blue-primary) hover:bg-blue-700 text-(--white) rounded-lg transition-colors text-sm sm:text-base cursor-pointer"
              >
                ใช้ตัวกรอง
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}