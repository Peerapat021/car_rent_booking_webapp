"use client";
import { useState, useRef, useEffect } from "react";
import { FaArrowLeft, FaImage, FaPaperPlane, FaTimes } from "react-icons/fa";

interface ChatMessage {
  id: number;
  text?: string;
  images?: string[];
  sender: "user" | "admin";
  time: string;
}

export default function ChatPage() {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedImages, setSelectedImages] = useState<{ url: string }[]>([]);
  const [modalImage, setModalImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => scrollToBottom(), [messages]);

  // แยกวันที่และเวลา
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleSelectImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imgs = files.map((file) => ({ url: URL.createObjectURL(file) }));
    setSelectedImages((prev) => [...prev, ...imgs]);
  };

  const handleSend = () => {
    if (!text.trim() && selectedImages.length === 0) return;

    const newMsg: ChatMessage = {
      id: Date.now(),
      text: text || undefined,
      images: selectedImages.length
        ? selectedImages.map((i) => i.url)
        : undefined,
      sender: "user",
      time: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setText("");
    setSelectedImages([]);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Mock reply from admin
    setTimeout(() => {
      const reply: ChatMessage = {
        id: Date.now() + 1,
        text: "นี่คือข้อความตอบกลับจาก admin",
        sender: "admin",
        time: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, reply]);
    }, 1500);

    setTimeout(scrollToBottom, 200);
  };

  return (
    <div className="fixed inset-0 top-0 bottom-[72px] sm:top-[60px] sm:bottom-0 bg-gray-100 flex flex-col z-40 max-w-[960px] mx-auto">
      {/* HEADER */}
      <div className="bg-white shadow-sm border-b p-4 flex items-center gap-3 shrink-0">
        <button onClick={() => window.history.back()}>
          <FaArrowLeft className="text-xl cursor-pointer text-gray-600 hover:text-blue-500 transition-colors" />
        </button>
        <h1 className="text-lg font-semibold text-gray-800">แชท</h1>
      </div>

      {/* CHAT LIST */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`w-full my-2 flex ${msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
          >
            <div
              className={`flex ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                } gap-2 max-w-full sm:max-w-[75%] items-end`}
            >
              {/* ข้อความ + รูป */}
              <div
                className={`p-3 rounded-2xl shadow text-sm flex flex-col wrap-break-word
                    ${msg.sender === "user"
                    ? "bg-white text-black  self-end"
                    : "bg-white text-black  self-start"
                  } w-fit max-w-[46vw]`}
              >
                {msg.text && <p>{msg.text}</p>}
                {msg.images && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {msg.images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        className="w-32 h-32 object-cover rounded-lg cursor-pointer"
                        onClick={() => setModalImage(img)}
                        alt="รูปภาพ"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* เวลา */}
              <div
                className={`text-xs text-gray-500 mb-1 ${msg.sender === "user" ? "text-right" : "text-left"
                  }`}
              >
                <div>{formatDate(msg.time)}</div>
                <div>{formatTime(msg.time)}</div>
              </div>
            </div>
          </div>
        ))}

        {/* ใช้ div นี้เพื่อ scrollToBottom */}
        <div ref={messagesEndRef} />
      </div>

      {/* PREVIEW รูป */}
      {selectedImages.length > 0 && (
        <div className="p-3 flex gap-3 bg-white border-t overflow-x-auto shrink-0">
          {selectedImages.map((img, index) => (
            <div key={index} className="relative">
              <img
                src={img.url}
                className="w-20 h-20 rounded-lg object-cover border cursor-pointer"
                onClick={() => setModalImage(img.url)}
              />
              <button
                onClick={() =>
                  setSelectedImages((prev) =>
                    prev.filter((_, i) => i !== index)
                  )
                }
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow cursor-pointer"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* INPUT */}
      <div className="p-3 bg-white flex items-center gap-3 border-t shrink-0">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-blue-600 text-2xl"
        >
          <FaImage />
        </button>

        <input
          type="file"
          multiple
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={handleSelectImages}
        />

        <textarea
          ref={textareaRef}
          className="flex-1 px-4 py-2 rounded-xl border resize-none overflow-hidden box-border"
          placeholder="พิมพ์ข้อความ..."
          value={text}
          rows={1}
          style={{ height: "auto" }}
          onChange={(e) => {
            setText(e.target.value);
            const el = e.target;
            el.style.height = "auto";
            const lineHeight = 24;
            const maxHeight = 4 * lineHeight;
            el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />

        <button
          onClick={handleSend}
          className="bg-blue-600 text-white px-4 py-2 rounded-full"
        >
          <FaPaperPlane />
        </button>
      </div>

      {/* MODAL */}
      {modalImage && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setModalImage(null)}
        >
          <button
            className="fixed top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full shadow flex items-center justify-center text-black text-xl cursor-pointer z-50"
            onClick={() => setModalImage(null)}
          >
            <FaTimes />
          </button>

          <img
            src={modalImage}
            className="max-w-[90vw] max-h-[85vh] rounded-lg shadow-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
