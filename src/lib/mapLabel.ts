export function createMapLabel(options: {
  text: string;
  background: string;
  shadow: string;
  padding?: string;
}): HTMLDivElement {
  const element = document.createElement("div");
  element.textContent = options.text;
  Object.assign(element.style, {
    background: options.background,
    color: "#fff",
    fontSize: "11px",
    fontWeight: "700",
    padding: options.padding ?? "5px 9px",
    borderRadius: "18px",
    border: "2px solid #fff",
    boxShadow: options.shadow,
    whiteSpace: "nowrap",
  });
  return element;
}
