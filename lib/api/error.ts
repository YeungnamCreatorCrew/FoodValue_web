/** API 호출이 실패했을 때 던지는 오류. status는 HTTP 상태 코드(400, 404, 500 ...) */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
