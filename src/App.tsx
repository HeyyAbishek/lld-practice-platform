import { Route, Routes } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ProblemListPage } from './components/ProblemListPage';
import { ProblemDetailPage } from './components/ProblemDetailPage';
import { useProgress } from './hooks/useProgress';

export default function App() {
  const progress = useProgress();

  return (
    <div className="flex h-full min-h-screen">
      <Sidebar progress={progress} />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard progress={progress} />} />
          <Route path="/problems" element={<ProblemListPage progress={progress} />} />
          <Route
            path="/problems/:slug"
            element={<ProblemDetailPage progress={progress} />}
          />
        </Routes>
      </main>
    </div>
  );
}
