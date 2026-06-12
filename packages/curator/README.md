# @aether/curator

Default-deny security gate for AI-generated actions.

## Features

- Allow-list enforcement
- Rate limiting (max 10 actions per response)
- Decision logging
- 422 on denial

## Usage

```typescript
import { curateActions, logCuratorVerdict } from '@aether/curator';

const result = curateActions(actions, { maxActions: 10 });
if (!result.approved) {
  return res.status(422).json({ error: result.reason });
}
logCuratorVerdict(result);
```

## Allow-List

```typescript
['stat', 'chart', 'list', 'status', 'gauge']