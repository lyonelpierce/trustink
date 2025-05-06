'use client';

import WidthWrapper from "../WidthWrapper";
import { motion } from "framer-motion";
import { CountCard } from "@/lib/counters";

const stats = [
  {
    value: 29,
    label: "Avg. SMB contract cycle",
    suffix: " days"
  },
  {
    value: 82,
    label: "Clauses never read",
    suffix: " %"
  },
  {
    value: 15,
    label: "Equity lost to legal drag",
    suffix: " %"
  }
];

const ProblemSection = () => {
  return (
    <section className="py-32 bg-black relative overflow-hidden">
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
            <span className="text-gray-300">Lawyers cost</span>{" "}
            <span className="bg-white text-black px-4 py-1 rounded-lg">money</span>
            <br />
            <span className="text-gray-300">time costs</span>{" "}
            <span className="bg-white text-black px-4 py-1 rounded-lg">even more</span>
          </h2>
          <p className="text-2xl text-gray-300 max-w-2xl mx-auto mt-8">
            The Figma for agreements. Edit contracts in real-time, just like a doc.
          </p>
        </motion.div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              <CountCard
                value={stat.value}
                label={stat.label}
                suffix={stat.suffix}
              />
            </motion.div>
          ))}
        </div>
      </WidthWrapper>
    </section>
  );
};

export default ProblemSection; 