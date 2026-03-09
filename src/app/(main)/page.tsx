"use client";
import Slider from '../../components/Home/Slider'
import LastViewed from '../../components/Home/LastViewed'
import Popular from "../../components/Home/Popular";
import SuggestDestination from "../../components/Home/SuggestDestination";
import Favorites from "../../components/Home/Favorites";
import Events from '../../components/Home/Events';
import Header from '@/components/Header'


export default function HomePage() {



  return (
    <div className="lg:pt-20">
      <div className='md:hidden sticky top-0 z-50'>
        <Header />
      </div>
      <div className="mx-4 sm:mx-6 md:mx-10 flex flex-col gap-5">
        <Slider />
        <LastViewed />
        <Popular />
        <Favorites />
        <SuggestDestination />
        <Events />
      </div>




    </div>
  );
}
