'use client';

import WidthWrapper from "../WidthWrapper";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

const metrics = [
  {
    value: "2",
    label: "Founders",
    detail: "Ex‑founders, YC alumni"
  },
  {
    value: "3",
    label: "Advisors",
    detail: "Ex‑GC, ex‑BigLaw, ex‑DocuSign"
  },
  {
    value: "1",
    label: "Prototype",
    detail: "Live sandbox"
  }
];

const TractionSection = () => {
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
            <span className="text-gray-300">Early</span>{" "}
            <span className="bg-white text-black px-4 py-1 rounded-lg">traction</span>
          </h2>
        </motion.div>

        <div className="flex flex-col md:flex-row justify-center gap-8">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="w-[320px] bg-[#111] border-[#222]">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold text-white mb-2">{metric.value}</div>
                  <div className="text-lg text-white mb-2">{metric.label}</div>
                  <div className="text-sm text-gray-300">{metric.detail}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </WidthWrapper>
    </section>
  );
};

export default TractionSection; 