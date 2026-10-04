"use client";

import { createContext, useContext } from "react";
import type { TableSpeakerId } from "@/lib/the-great-game/table-speaker";

export const SupporterContext = createContext<TableSpeakerId | null>(null);
export const useSupporter = () => useContext(SupporterContext);
