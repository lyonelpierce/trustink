'use client';

import WidthWrapper from "../WidthWrapper";
import { motion } from "framer-motion";
import { Code } from "lucide-react";

const items = [
  { title: 'Whisper v3', detail: 'Streams speech → text in < 300 ms' },
  { title: 'GPT‑4o function‑calls', detail: 'Plain English → JSON edits' },
  { title: 'pgvector RAG', detail: 'Retrieves exact clause history' },
  { title: 'React‑Diff‑View', detail: 'Side‑by‑side red / green diffs' },
  { title: 'ElevenLabs', detail: 'Speaks "Clause updated." (optional)' },
  { title: 'Supabase RLS', detail: 'Every edit scoped to user & doc' },
];

const TechStackSection = () => {
  return (
    <section className="py-32 bg-gradient-to-b from-black via-[#07131A] to-black relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>
      <WidthWrapper>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent blur-3xl" />
          <h2 className="text-7xl font-bold mb-6 relative">
            <span className="text-gray-300">How it</span>{" "}
            <span className="bg-white text-black px-4 py-1 rounded-lg">works</span>
          </h2>
        </motion.div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="group p-8 text-center bg-black/50 backdrop-blur-sm rounded-xl border-2 border-white/20 transform transition-all duration-300 hover:scale-105"
            >
              <div className="mb-4 text-2xl font-bold text-white group-hover:text-gray-300 transition-colors">
                {item.title}
              </div>
              <div className="text-gray-300 text-sm">
                {item.detail}
              </div>
            </motion.div>
          ))}
        </div>
      </WidthWrapper>
    </section>
  );
};

export default TechStackSection; 