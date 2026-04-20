# 03_INTERFACE_SYSTEM

Здесь живёт product-facing interface-system cluster.

Это часть `03_PRODUCT`, а не отдельный top-level layer.

## Структура

- `00_RULES/` — рабочие правила и принципы
- `01_AUDITS/` — audit layer для interface-system inventory и synthesis
- `02_CANON/` — emerging canonical interface-system truth
- `03_ROLLOUT/` — rollout maps, migration maps и rollout-oriented support docs

## Правило раздела

Здесь хранить:

- interface-system language;
- control families;
- token and control inventory;
- migration and rollout docs вокруг UI system.

Здесь не хранить:

- runtime architecture contracts;
- generic execution briefs;
- closed historical leftovers.

Если документ отвечает на вопрос "как должен выглядеть и организовываться
продуктовый интерфейсный слой", он обычно принадлежит сюда.
