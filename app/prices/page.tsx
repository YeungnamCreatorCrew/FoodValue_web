import { redirect } from "next/navigation";

/** 품목 표는 홈으로 합쳤다. 예전 주소(/prices)로 오면 홈으로 보낸다. */
export default function PricesPage() {
  redirect("/");
}
