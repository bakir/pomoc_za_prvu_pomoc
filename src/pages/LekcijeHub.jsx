import { BITNE_BRZINE_QUIZ_IDS, BITNE_BRZINE_SECTIONS } from '../data/bitneBrzine';
import { UDALJENOSTI_QUIZ_IDS, UDALJENOSTI_SECTIONS } from '../data/udaljenosti';
import { navigateToLekcijeLesson } from '../routing';

const LESSONS = [
  {
    id: 'bitne-brzine',
    title: 'Bitne brzine',
    description:
      'Ograničenja brzine po tipu puta, za vozače početnike i specifična vozila — sa kvizom iz kataloga propisa.',
    topics: BITNE_BRZINE_SECTIONS.length,
    questions: BITNE_BRZINE_QUIZ_IDS.length,
    accent: 'speed',
  },
  {
    id: 'udaljenosti',
    title: 'Udaljenosti i rastojanja',
    description:
      'Parkiranje, pješački prelazi, bezbjednosni trokut, željeznička pruga, odstojanje vozila i zaštitni pojas puta.',
    topics: UDALJENOSTI_SECTIONS.length,
    questions: UDALJENOSTI_QUIZ_IDS.length,
    accent: 'distance',
  },
];

export default function LekcijeHub() {
  return (
    <div className="lekcije-page lekcije-hub">
      <header className="lekcije-hero card">
        <p className="lekcije-eyebrow">Lekcije · B kategorija</p>
        <h1>Centar za učenje</h1>
        <p className="lekcije-intro">
          Odaberite temu za učenje kroz proširive sekcije, zatim provjerite znanje kvizom na kraju
          svake lekcije. Sva pitanja dolaze iz kataloga propisa (kategorija B).
        </p>
      </header>

      <div className="lekcije-hub-grid">
        {LESSONS.map((lesson) => (
          <article
            key={lesson.id}
            className={`lekcije-hub-card card lekcije-hub-card-${lesson.accent}`}
          >
            <h2>{lesson.title}</h2>
            <p>{lesson.description}</p>
            <div className="lekcije-stats">
              <span>{lesson.topics} teme</span>
              <span>{lesson.questions} pitanja u kvizu</span>
            </div>
            <button
              type="button"
              className="primary-button lekcije-hub-open"
              onClick={() => navigateToLekcijeLesson(lesson.id)}
            >
              Otvori lekciju
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
