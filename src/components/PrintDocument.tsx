import { useEffect } from "react";
import { createPortal } from "react-dom";

export type PrintRow = { name: string; price: number };
export type PrintKV = { label: string; value: string };

export type PrintDocumentProps = {
  onDone: () => void;
  title: string;
  meta: PrintKV[];
  sections?: { title: string; rows: PrintKV[] }[];
  works: PrintRow[];
  total: number;
  totalLabel?: string;
  footer?: PrintKV[];
  signatures?: boolean;
};

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU").format(Math.round(n)) + " ₽";

export function PrintDocument(props: PrintDocumentProps) {
  useEffect(() => {
    const onAfter = () => props.onDone();
    window.addEventListener("afterprint", onAfter);
    const t = window.setTimeout(() => {
      try {
        window.print();
      } catch {
        props.onDone();
      }
    }, 80);
    return () => {
      window.removeEventListener("afterprint", onAfter);
      window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div id="print-root">
      <div className="print-header">
        <div className="print-brand">Автосервис «Самсон»</div>
        <div className="print-title">{props.title}</div>
      </div>

      {props.meta.length > 0 && (
        <div className="print-meta">
          {props.meta.map((m, i) => (
            <div key={i}>
              <span style={{ color: "#555" }}>{m.label}: </span>
              <b>{m.value || "—"}</b>
            </div>
          ))}
        </div>
      )}

      {props.sections?.map((s, i) => (
        <div key={i} className="print-section">
          <h3>{s.title}</h3>
          <table className="print-kv">
            <tbody>
              {s.rows.map((r, j) => (
                <tr key={j}>
                  <td className="k">{r.label}</td>
                  <td>{r.value || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div className="print-section">
        <h3>Работы</h3>
        <table className="print-works">
          <thead>
            <tr>
              <th style={{ width: "6%" }}>№</th>
              <th>Наименование</th>
              <th style={{ width: "22%", textAlign: "right" }}>Стоимость</th>
            </tr>
          </thead>
          <tbody>
            {props.works.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", color: "#666" }}>
                  Нет работ
                </td>
              </tr>
            ) : (
              props.works.map((w, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{w.name}</td>
                  <td style={{ textAlign: "right" }}>{fmt(w.price)}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr>
              <td
                colSpan={2}
                style={{ textAlign: "right", fontWeight: "bold" }}
              >
                {props.totalLabel ?? "Итого"}:
              </td>
              <td style={{ textAlign: "right", fontWeight: "bold" }}>
                {fmt(props.total)}
              </td>
            </tr>
            {props.footer?.map((f, i) => (
              <tr key={i}>
                <td colSpan={2} style={{ textAlign: "right" }}>
                  {f.label}:
                </td>
                <td style={{ textAlign: "right" }}>{f.value}</td>
              </tr>
            ))}
          </tfoot>
        </table>
      </div>

      {props.signatures && (
        <div className="print-signatures">
          <div>Клиент: ______________________ / ______________</div>
          <div>Мастер: ______________________ / ______________</div>
        </div>
      )}
    </div>,
    document.body,
  );
}
