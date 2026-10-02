-- Notsopedia Firestore -> Supabase migration
-- Generated automatically. Review before running.

begin;

-- Existing Supabase notes should be empty at this point.
-- This migration does not modify RLS policies.

insert into public.notes (
  id,
  title,
  content,
  subject_name,
  subject_code,
  topic_name,
  uploader_name,
  uploader_role,
  uploader_email,
  owner_id,
  file_url,
  file_name,
  file_size,
  note_type,
  tags,
  language,
  source_type,
  likes,
  uploaded_at,
  updated_at
) values (
  'note-1790186614076',
  'AI and ROBOTICS',
  '*(Attached file: Arduino_SBC_Study_Notes.pdf)*',
  'AI and ROBOTICS',
  'GEN-ACAD',
  'AI and ROBOTICS',
  'System Administrator',
  'Administrator',
  'admin@notsopedia.org',
  'b4959a30-026a-43bf-a45d-f677bc69251f',
  'https://txuyyazekegdiityhcwi.supabase.co/storage/v1/object/public/Notesopedia/legacy/note-1790186614076-Arduino_SBC_Study_Notes.pdf',
  'Arduino_SBC_Study_Notes.pdf',
  2671623,
  'AI and ROBOTICS',
  '{}',
  NULL,
  'College',
  10,
  '2026-09-23T18:03:34.080Z',
  '2026-09-23T18:03:34.080Z'
);

insert into public.notes (
  id,
  title,
  content,
  subject_name,
  subject_code,
  topic_name,
  uploader_name,
  uploader_role,
  uploader_email,
  owner_id,
  file_url,
  file_name,
  file_size,
  note_type,
  tags,
  language,
  source_type,
  likes,
  uploaded_at,
  updated_at
) values (
  'note-1790187326433',
  'AI and ROBOTICS',
  '*(Attached file: Arduino_SBC_Study_Notes.pdf)*',
  'AI and ROBOTICS',
  'GEN-ACAD',
  'AI and ROBOTICS',
  'chetan',
  'Student',
  'chetanaagle2007@gmail.com',
  (select id from public.users where lower(email) = lower('chetanaagle2007@gmail.com') limit 1),
  'https://txuyyazekegdiityhcwi.supabase.co/storage/v1/object/public/Notesopedia/legacy/note-1790186614076-Arduino_SBC_Study_Notes.pdf',
  'Arduino_SBC_Study_Notes.pdf',
  2671623,
  'AI and ROBOTICS',
  '{}',
  NULL,
  'College',
  2,
  '2026-09-23T18:15:26.441Z',
  '2026-09-23T18:15:26.441Z'
);

insert into public.notes (
  id,
  title,
  content,
  subject_name,
  subject_code,
  topic_name,
  uploader_name,
  uploader_role,
  uploader_email,
  owner_id,
  file_url,
  file_name,
  file_size,
  note_type,
  tags,
  language,
  source_type,
  likes,
  uploaded_at,
  updated_at
) values (
  'note-1790342714711',
  'Supabase Upload Test',
  'Testing permanent note saving',
  'Test',
  'TEST-001',
  'Supabase Test',
  'Chetan',
  'Student',
  'chetanaagle2007@gmail.com',
  (select id from public.users where lower(email) = lower('chetanaagle2007@gmail.com') limit 1),
  'https://txuyyazekegdiityhcwi.supabase.co/storage/v1/object/public/Notesopedia/test.txt',
  'test.txt',
  4,
  'Study Notes',
  ARRAY['test', 'supabase'],
  'English',
  'Personal',
  0,
  '2026-09-25T13:25:14.711Z',
  '2026-09-25T13:25:14.711Z'
);

insert into public.notes (
  id,
  title,
  content,
  subject_name,
  subject_code,
  topic_name,
  uploader_name,
  uploader_role,
  uploader_email,
  owner_id,
  file_url,
  file_name,
  file_size,
  note_type,
  tags,
  language,
  source_type,
  likes,
  uploaded_at,
  updated_at
) values (
  'note-1790343472598',
  'supabase uplaod taste',
  '*(Attached file: Arduino_SBC_Study_Notes.pdf)*',
  'supabase',
  'GEN-ACAD',
  'General Study Guide',
  'chetan',
  'Student',
  'chetanaagle2007@gmail.com',
  (select id from public.users where lower(email) = lower('chetanaagle2007@gmail.com') limit 1),
  'https://txuyyazekegdiityhcwi.supabase.co/storage/v1/object/public/Notesopedia/1790343461953-Arduino_SBC_Study_Notes.pdf',
  'Arduino_SBC_Study_Notes.pdf',
  2671623,
  'General',
  '{}',
  NULL,
  'File Upload',
  1,
  '2026-09-25T13:37:52.598Z',
  '2026-09-25T13:37:52.598Z'
);

insert into public.notes (
  id,
  title,
  content,
  subject_name,
  subject_code,
  topic_name,
  uploader_name,
  uploader_role,
  uploader_email,
  owner_id,
  file_url,
  file_name,
  file_size,
  note_type,
  tags,
  language,
  source_type,
  likes,
  uploaded_at,
  updated_at
) values (
  'univ-note-1',
  'Understanding Graph Traversal: BFS vs DFS Algorithms',
  'Graph traversal forms the core of network analysis, routing, and search space discovery.

### Breadth-First Search (BFS)
- **Strategy**: Explores level-by-level, visiting all neighbor vertices of a node before moving to deeper levels.
- **Data Structure**: Uses a **Queue** (First-In, First-Out).
- **Complexity**: $O(V + E)$ where $V$ is vertices and $E$ is edges.
- **Key Use Case**: Finding the absolute shortest path on unweighted graphs.

### Depth-First Search (DFS)
- **Strategy**: Plunges as deep as possible along each branch before backtracking.
- **Data Structure**: Uses a **Stack** (implicitly via recursion or explicitly).
- **Complexity**: $O(V + E)$.
- **Key Use Case**: Topological sorting, checking for cycles, and solving mazes.

```python
# Basic recursive DFS representation in Python
def dfs(graph, node, visited=None):
    if visited is None:
        visited = set()
    if node not in visited:
        print(f''Visiting vertex: {node}'')
        visited.add(node)
        for neighbor in graph[node]:
            dfs(graph, neighbor, visited)
    return visited
```',
  'Data Structures & Algorithms',
  'CS-201',
  'Graph Algorithms',
  'Dr. Alisha Vance',
  'Professor',
  'alisha.vance@university.edu',
  (select id from public.users where lower(email) = lower('alisha.vance@university.edu') limit 1),
  NULL,
  NULL,
  NULL,
  'General',
  '{}',
  NULL,
  NULL,
  42,
  '2026-06-29T10:30:00.000Z',
  '2026-06-29T10:30:00.000Z'
);

insert into public.notes (
  id,
  title,
  content,
  subject_name,
  subject_code,
  topic_name,
  uploader_name,
  uploader_role,
  uploader_email,
  owner_id,
  file_url,
  file_name,
  file_size,
  note_type,
  tags,
  language,
  source_type,
  likes,
  uploaded_at,
  updated_at
) values (
  'univ-note-2',
  'The Schrödinger Equation & Wave Functions Demystified',
  'The Schrödinger Equation represents the cornerstone of modern quantum mechanics, describing how the quantum state of a physical system changes over time.

### Time-Independent Schrödinger Equation
$$\hat{H}\psi = E\psi$$
- $\hat{H}$ is the Hamiltonian Operator (representing total energy).
- $\psi$ is the Wave Function (describes spatial probability amplitude).
- $E$ is the total energy eigenvalue.

### Interpretations of the Wave Function
Max Born proposed that the square of the magnitude of the wave function, $|\psi(x)|^2$, represents the probability density of finding a particle at a given coordinate $x$ at a specific time.

- **Normalisation**: The probability of finding the particle *somewhere* in the universe must sum to 1.
$$\int_{-\infty}^{\infty} |\psi(x)|^2 dx = 1$$',
  'Advanced Quantum Mechanics',
  'PHYS-402',
  'Quantum Foundations',
  'Chetana Agle',
  'Lead TA',
  'chetanaagle2007@gmail.com',
  (select id from public.users where lower(email) = lower('chetanaagle2007@gmail.com') limit 1),
  NULL,
  NULL,
  NULL,
  'General',
  '{}',
  NULL,
  NULL,
  45,
  '2026-06-30T04:15:00.000Z',
  '2026-06-30T04:15:00.000Z'
);

insert into public.notes (
  id,
  title,
  content,
  subject_name,
  subject_code,
  topic_name,
  uploader_name,
  uploader_role,
  uploader_email,
  owner_id,
  file_url,
  file_name,
  file_size,
  note_type,
  tags,
  language,
  source_type,
  likes,
  uploaded_at,
  updated_at
) values (
  'univ-note-3',
  'Key Macroeconomic Indicators & Policy Impacts',
  'How governments manipulate variables to direct national markets:

1. **Gross Domestic Product (GDP)**:
   $$GDP = C + I + G + (X - M)$$
   - $C$: Private Consumption
   - $I$: Capital Investments
   - $G$: Government Spending
   - $(X-M)$: Net Exports (Exports minus Imports)

2. **Fiscal Policy Tools**:
   - **Taxation Changes**: Adjusts consumer disposable income and spending power.
   - **Government Investment**: Directly stimulates target industries and increases public employment.

3. **Monetary Policy Tools** (Managed by Central Banks):
   - **Reserve Requirements**: Minimum liquid cash reserves banks must hold.
   - **Discount Rate**: The lending rate charged to commercial entities.
   - **Open Market Operations**: Buying/selling treasury bills to influence cash liquidity.',
  'Macroeconomic Theory',
  'ECON-101',
  'Economic Indicators',
  'Amit Sharma',
  'Student',
  'amit.sharma99@student.edu',
  (select id from public.users where lower(email) = lower('amit.sharma99@student.edu') limit 1),
  NULL,
  NULL,
  NULL,
  'General',
  '{}',
  NULL,
  NULL,
  24,
  '2026-06-30T07:45:00.000Z',
  '2026-06-30T07:45:00.000Z'
);

commit;

