'use client';

import WidthWrapper from "../WidthWrapper";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

const founders = [
  {
    name: 'Lyonel',
    role: 'Co‑founder / CEO – New York',
    bio: 'Product engineer; shipped fintech onboarding & e‑signature to 300 k users at two YC startups.'
  },
  {
    name: 'Moises',
    role: 'Co‑founder / CTO – Miami',
    bio: 'Full‑stack ML; built PDF‑embedding pipeline for contract analytics prototype (Python, Next.js, Supabase).'
  }
];

const TeamSection = () => {
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
            <span className="text-gray-300">Meet the</span>{" "}
            <span className="bg-white text-black px-4 py-1 rounded-lg">team</span>
          </h2>
        </motion.div>

        <div className="flex flex-col md:flex-row justify-center gap-8">
          {founders.map((founder, index) => (
            <motion.div
              key={founder.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="w-[320px] bg-[#111] border-[#222]">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-white">{founder.name}</h3>
                  <p className="text-sm text-white mb-2">{founder.role}</p>
                  <p className="text-sm text-gray-300">{founder.bio}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </WidthWrapper>
    </section>
  );
};

export default TeamSection; 