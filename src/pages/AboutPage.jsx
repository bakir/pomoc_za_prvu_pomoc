const GITHUB_URL = 'https://github.com/bakir/pomoc_za_prvu_pomoc';
const QUESTIONS_CATALOG_URL =
  'https://mo.ks.gov.ba/sed-obavhestenja/obavjestenje-novi-katalog-pitanja-za-polaganje-prve-pomoci';

export default function AboutPage({ onNavigate }) {
  return (
    <div className="card help-page">
      <h1>O aplikaciji</h1>
      <p className="help-intro">
        Ova aplikacija pomaže u učenju pitanja iz prve pomoći. Imate dva načina rada:{' '}
        <strong>vježbu</strong> (učite dok napredak raste) i <strong>ispit</strong> (10 nasumičnih
        pitanja bez uticaja na napredak). Prebacujte se između njih gornjim dugmadima{' '}
        <strong>Vježba</strong>, <strong>Ispit</strong> i <strong>O aplikaciji</strong>.
      </p>

      <section className="help-section">
        <h2>Vježba</h2>
        <ol>
          <li>Pročitajte pitanje i odaberite odgovor klikom ili tastaturom.</li>
          <li>
            Za svako pitanje trebate <strong>3 tačna odgovora</strong> da biste ga savladali. To
            pratite kroz „Tačno odgovoreno: 0/3”.
          </li>
          <li>Nakon odgovora pritisnite <kbd>Enter</kbd> ili dugme „Dalje” za sljedeće pitanje.</li>
          <li>
            Dugme „Provjeri tačan odgovor” (ili tipka <kbd>4</kbd>) otkriva tačan odgovor, ali{' '}
            <strong>ne povećava</strong> napredak — korisno za učenje.
          </li>
        </ol>
      </section>

      <section className="help-section">
        <h2>Tastatura (vježba)</h2>
        <ul className="help-shortcuts">
          <li><kbd>1</kbd> — prvi odgovor</li>
          <li><kbd>2</kbd> — drugi odgovor</li>
          <li><kbd>3</kbd> — treći odgovor</li>
          <li><kbd>4</kbd> — provjeri tačan odgovor</li>
          <li><kbd>Enter</kbd> — nastavi na sljedeće pitanje</li>
        </ul>
      </section>

      <section className="help-section">
        <h2>Alati u vježbi</h2>
        <ul>
          <li>
            <strong>?</strong> — lista svih pitanja i napretka; kliknite pitanje da skočite na njega
          </li>
          <li>
            <strong>⚙</strong> — postavke: miješanje pitanja/odgovora i reset napretka
          </li>
        </ul>
      </section>

      <section className="help-section">
        <h2>Ispit (10 pitanja)</h2>
        <p>
          Odaberite <strong>Ispit</strong> u traci iznad. Dobijate 10 nasumičnih pitanja odjednom —
          odaberite odgovore bez povratne informacije, zatim kliknite <strong>Predaj ispit</strong>{' '}
          da vidite rezultat (npr. 7/10). Ispit <strong>ne mijenja</strong> vaš napredak u vježbi.
        </p>
      </section>

      <section className="help-section">
        <h2>Kolačići</h2>
        <p>
          Napredak u vježbi čuva se u <strong>kolačićima</strong> u vašem pregledniku. Podaci ne
          napuštaju vaš uređaj i ne dijele se s trećim stranama.
        </p>
      </section>

      <section className="help-section">
        <h2>Linkovi</h2>
        <a className="help-link" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
          GitHub repozitorij
        </a>
        <a
          className="help-link"
          href={QUESTIONS_CATALOG_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Zvanični katalog pitanja (PDF)
        </a>
      </section>

      <div className="help-actions">
        <button type="button" className="secondary-button" onClick={() => onNavigate('practice')}>
          Nazad na vježbu
        </button>
      </div>
    </div>
  );
}
