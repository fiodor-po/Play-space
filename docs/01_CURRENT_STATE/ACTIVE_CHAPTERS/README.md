# ACTIVE_CHAPTERS

Здесь живут только текущие chapter control docs.

## Структура

Для каждого active chapter использовать folder вида:

- `docs/01_CURRENT_STATE/ACTIVE_CHAPTERS/<chapter>/CHAPTER.md`
- `docs/01_CURRENT_STATE/ACTIVE_CHAPTERS/<chapter>/AUDITS/`
- `docs/01_CURRENT_STATE/ACTIVE_CHAPTERS/<chapter>/NOTES/`

## Что такое `CHAPTER.md`

`CHAPTER.md` — это operational control file.

Он хранит:

- цель chapter;
- scope;
- out-of-scope;
- slice order;
- acceptance direction;
- ссылки на canonical product / architecture docs.

Он не должен подменять:

- product spec;
- architecture doc;
- archive bundle.

## Что хранить в `AUDITS/`

В `AUDITS/` хранить только живые dated analyses, которые поддерживают текущий
chapter.

Если audit больше не обслуживает active chapter, его переносить в
`docs/90_ARCHIVE/`.

## Что хранить в `NOTES/`

В `NOTES/` хранить только короткие рабочие заметки между slices.

Если note стал durable current truth, его нужно либо:

- встроить в canonical doc;
- либо превратить в осмысленный current-state control doc.

## Closure rule

После closure chapter:

- folder больше не держать в `ACTIVE_CHAPTERS/`;
- bundle переносить в `docs/90_ARCHIVE/03_CLOSED_CHAPTERS/<chapter>/`;
- roadmap и current-context должны ссылаться уже на archived bundle или на
  новый active chapter.
