# 03_PRODUCT

Здесь живёт продуктовая документация.

Целевой принцип:

- отдельно product overview
- отдельно user/room/identity flows
- отдельно semantic models
- отдельно временные product chapters

Текущий canonical набор для этого раздела:

- [`docs/03_PRODUCT/00_OVERVIEW/PRODUCT_FOUNDATION.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/03_PRODUCT/00_OVERVIEW/PRODUCT_FOUNDATION.md)
- [`docs/03_PRODUCT/01_FLOWS/room-behavior-spec.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/03_PRODUCT/01_FLOWS/room-behavior-spec.md)
- [`docs/03_PRODUCT/01_FLOWS/participant-identity-design.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/03_PRODUCT/01_FLOWS/participant-identity-design.md)
- [`docs/03_PRODUCT/02_SEMANTICS/color-model-design.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/03_PRODUCT/02_SEMANTICS/color-model-design.md)
- [`docs/03_PRODUCT/02_SEMANTICS/object-semantics-design.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/03_PRODUCT/02_SEMANTICS/object-semantics-design.md)
- [`docs/03_PRODUCT/03_INTERFACE_SYSTEM/README.md`](/Users/fedorpodrezov/Developer/play-space-alpha/docs/03_PRODUCT/03_INTERFACE_SYSTEM/README.md)

Правило раздела:

- product overview, flows и semantic truth хранить здесь;
- interface-system cluster тоже хранить здесь как часть product layer;
- topic-scoped `design`, `draft` и `spec` docs можно держать здесь как working
  product docs;
- supporting `audit` / `memo` / `plan` docs держать здесь только пока они
  помогают живому product topic, иначе переносить в `docs/90_ARCHIVE/`;
- runtime contracts, persistence, sync и governance хранить в `docs/04_ARCHITECTURE/`;
- operational runbooks хранить в `docs/05_OPERATIONS_AND_VALIDATION/`.
