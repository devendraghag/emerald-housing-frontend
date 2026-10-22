function memberPayload(form) {
  return {
    fullName: form.fullName.trim(),
    mobileNumber: form.mobileNumber.trim(),
    email: (form.email || "").trim() || null,
  };
}
function flatPayload(form) {
  return {
    flatNumber: form.flatNumber.trim(),
    floorNumber: Number(form.floorNumber),
  };
}
function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}
function errorMessage(error) {
  if (error.response && error.response.status === 401)
    return "A valid backend session is required. Establish your session and retry.";
  const data = error.response && error.response.data;
  const fields = data && (data.details || data.fieldErrors || data.errors);
  const details =
    fields && typeof fields === "object"
      ? Object.entries(fields)
          .map(
            ([key, value]) =>
              `${key}: ${
                typeof value === "string" ? value : JSON.stringify(value)
              }`
          )
          .join("; ")
      : "";
  return [
    (data && (data.message || data.detail)) ||
      (error.response
        ? `Request failed (${error.response.status}).`
        : "Cannot reach the backend. Check that the gateway is running."),
    details,
  ]
    .filter(Boolean)
    .join(" ");
}
module.exports = { memberPayload, flatPayload, localDate, errorMessage };
