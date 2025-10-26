import axios from "axios";

const api = axios.create({
  baseURL: "https://localhost:7282",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    Pragma: "no-cache",
    "Cache-Control": "no-cache",
  },
});

export default api;
