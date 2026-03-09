"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Goback from "@/components/goback";
export default function PolicyPage() {
  const router = useRouter();

  return (
    <div className=" bg-gray-50 flex justify-center">
      <div className="w-full max-w-2xl bg-white md:p-8">
        {/* Mobile Header */}
        <Goback title="นโยบายความเป็นส่วนตัว" />

        {/* Desktop Header */}
        <h1 className="hidden md:block text-3xl mb-6 font-bold text-black">
          นโยบายความเป็นส่วนตัว
        </h1>
        <h2 className="font-bold text-black text-lg px-3 mt-5">นโยบายความเป็นส่วนตัว</h2>
        {/* Content */}
        <div className="prose prose-sm md:prose-base px-6 mt-2">
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. At vero
            eos et accusam et justo duo dolores et ea rebum. Stet clita kasd
            gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.
          </p>

          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed diam
            nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam
            erat, sed diam voluptua. At vero eos et accusam et justo duo
            dolores et ea rebum.
          </p>

          <p>
            Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum
            dolor sit amet. Lorem ipsum dolor sit amet, consectetur adipiscing
            elit, sed diam nonumy eirmod tempor invidunt ut labore et dolore
            magna aliquyam erat, sed diam voluptua.
          </p>

          <p>
            At vero eos et accusam et justo duo dolores et ea rebum. Stet clita
            kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit
            amet.
          </p>
          <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Modi sit, officiis cupiditate incidunt natus libero! Nesciunt cum quidem odit ut quod commodi. Quas ab necessitatibus possimus laudantium unde magni! In dolor, quod sequi sed aspernatur quasi porro perferendis unde officiis dignissimos numquam, quam sint veritatis mollitia necessitatibus vitae modi, cupiditate nam aut laudantium? Repudiandae praesentium quibusdam, magni eveniet ab placeat veniam cumque. Inventore, esse blanditiis deserunt dolorem alias ex quas consectetur quos deleniti, fuga a iure, dolorum ut earum magnam! Porro, consectetur fuga ipsa, omnis dolorem et dolorum corporis nihil ad molestiae est nam temporibus quod sequi odio quibusdam recusandae praesentium commodi neque autem consequuntur ex at aliquid. Aspernatur, illo natus necessitatibus, amet quod cum quia sequi omnis laudantium autem sunt est libero! Ad distinctio nesciunt ipsum explicabo aspernatur quos est et a beatae quod dolorum, natus exercitationem rem reprehenderit eveniet voluptatem velit officia tempore sapiente tenetur quo? Expedita quidem sapiente quisquam nisi quae! Dolores esse magni voluptatum placeat rem odit facilis, quae tempora vel! Aliquam, voluptates consequuntur ipsum temporibus nisi aliquid ea ullam libero aut incidunt iure iusto eaque similique, sint officia nemo commodi voluptate esse soluta modi repudiandae! Obcaecati nihil ab nesciunt accusantium magni veniam illo aut dolorem?</p>
        </div>
      </div>
    </div>
  );
}
