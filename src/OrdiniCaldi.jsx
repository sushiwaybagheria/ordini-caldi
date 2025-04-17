
import { useState, useEffect } from "react";

const STAGE_COLORS = {
  "CONFERMATO": "bg-white/30",
  "DA PREPARARE": "bg-yellow-300",
  "IN PREPARAZIONE": "bg-orange-400",
  "PRONTO": "bg-green-300"
};

const trillo = new Audio("/trillo.mp3");

function OrdiniCaldi() {
  const [ordini, setOrdini] = useState([]);
  const [confermaCancellazione, setConfermaCancellazione] = useState(false);

  const completatiLS = JSON.parse(localStorage.getItem("completati") || "[]");
  const ridottiLS = JSON.parse(localStorage.getItem("ridotti") || "[]");

  useEffect(() => {
    const fetchData = () => {
      fetch("/api/proxy")
        .then(res => res.json())
        .then(data => {
          const oggi = new Date().toISOString().split("T")[0];
          const filtrati = data.filter(o => o.data === oggi);
          setOrdini(
            filtrati.map(o => ({
              ...o,
              ridotto: ridottiLS.includes(o.id),
              completato: completatiLS.includes(o.id)
            }))
          );
        })
        .catch(err => console.error("❌ Errore fetch ordini (proxy):", err));
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const aggiornaStato = (id, nuovoStato) => {
    setOrdini(prev =>
      prev.map(o => o.id === id ? { ...o, stato: nuovoStato } : o)
    );
    if (nuovoStato === "DA PREPARARE") trillo.play();
  };

  const toggleRidotto = (id) => {
    const nuovi = ordini.map(o =>
      o.id === id ? { ...o, ridotto: !o.ridotto } : o
    );
    setOrdini(nuovi);
    const ridotti = nuovi.filter(o => o.ridotto).map(o => o.id);
    localStorage.setItem("ridotti", JSON.stringify(ridotti));
  };

  const segnaCompletato = (id) => {
    const nuovi = ordini.map(o =>
      o.id === id ? { ...o, completato: true, ridotto: true } : o
    );
    setOrdini(nuovi);
    const completati = nuovi.filter(o => o.completato).map(o => o.id);
    localStorage.setItem("completati", JSON.stringify(completati));
  };

  const cancellaCompletati = () => {
    setOrdini(prev => prev.filter(o => !o.completato));
    localStorage.setItem("completati", "[]");
    setConfermaCancellazione(false);
  };

  return (
    <div className="p-4 min-h-screen bg-gray-800 flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-center text-red-600">ORDINI CALDI</h1>

      {/* POST-IT ATTIVI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {ordini.filter(o => !o.ridotto && !o.completato).map((ordine) => (
          <div
            key={ordine.id}
            className={`shadow-xl rounded-xl ${STAGE_COLORS[ordine.stato]} transition-all`}
          >
            <div className="flex justify-between items-start p-2">
              <div className="font-bold text-sm">
                #{ordine.id} {ordine.tipo === "RITIRO" ? "📦" : "🛵"} {ordine.orario}
              </div>
              <button onClick={() => toggleRidotto(ordine.id)} className="text-lg" title="Riduci">🔽</button>
            </div>
            <div className="p-4 pt-0 space-y-2">
              <ul className="list-disc list-inside text-sm">
                {ordine.piatti.map((p, i) => (<li key={i}>{p}</li>))}
              </ul>
              <div className="flex justify-between pt-2 gap-1 flex-wrap">
                <button onClick={() => aggiornaStato(ordine.id, "CONFERMATO")} className="p-2 bg-white border rounded">🥡</button>
                <button onClick={() => aggiornaStato(ordine.id, "DA PREPARARE")} className="p-2 bg-white border rounded">🔔</button>
                <button onClick={() => aggiornaStato(ordine.id, "IN PREPARAZIONE")} className="p-2 bg-white border rounded">🔥</button>
                <button onClick={() => aggiornaStato(ordine.id, "PRONTO")} className="p-2 bg-white border rounded">✅</button>
                <button onClick={() => segnaCompletato(ordine.id)} className="p-2 bg-white border rounded">🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* DOCK - RIDOTTI */}
      {ordini.some(o => o.ridotto && !o.completato) && (
        <div className="pt-4 border-t border-gray-500">
          <h2 className="text-white text-sm font-semibold mb-2">Dock (ordini minimizzati):</h2>
          <div className="flex flex-wrap gap-2">
            {ordini.filter(o => o.ridotto && !o.completato).map(ordine => (
              <div key={ordine.id} className={`shadow-md rounded-lg px-3 py-2 flex items-center justify-between min-w-[200px] ${STAGE_COLORS[ordine.stato]}`}>
                <span className="text-sm font-bold truncate">
                  #{ordine.id} {ordine.tipo === "RITIRO" ? "📦" : "🛵"} {ordine.orario}
                </span>
                <button onClick={() => toggleRidotto(ordine.id)} className="text-lg" title="Espandi">🔼</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COMPLETATI */}
      {ordini.some(o => o.completato) && (
        <div className="pt-6 border-t border-gray-500">
          <h2 className="text-white text-sm font-semibold mb-2">Ordini completati:</h2>
          <div className="flex flex-wrap gap-2">
            {ordini.filter(o => o.completato).map(ordine => (
              <div key={ordine.id} className={`shadow-md rounded-lg px-3 py-2 flex items-center justify-between min-w-[200px] ${STAGE_COLORS[ordine.stato]}`}>
                <span className="text-sm font-bold truncate">
                  #{ordine.id} {ordine.tipo === "RITIRO" ? "📦" : "🛵"} {ordine.orario}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4">
            {!confermaCancellazione ? (
              <button onClick={() => setConfermaCancellazione(true)} className="px-4 py-2 bg-red-500 text-white rounded">Cancella tutto</button>
            ) : (
              <div className="space-x-2">
                <span className="text-white">Sei sicuro?</span>
                <button onClick={cancellaCompletati} className="px-3 py-1 bg-red-600 text-white rounded">Cancella</button>
                <button onClick={() => setConfermaCancellazione(false)} className="px-3 py-1 bg-gray-300 rounded">Annulla</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default OrdiniCaldi;
