"use client";

import { createContext, useContext } from "react";
import type { PriceModelTrack } from "./dto";

/** 상세 화면에서 고른 예측 모델. 요인 추이처럼 깊은 곳에서 API를 부르는 부품이 같은 모델로 부르게 한다. */
export const TrackContext = createContext<PriceModelTrack>("ENSEMBLE");
export const useTrack = () => useContext(TrackContext);
