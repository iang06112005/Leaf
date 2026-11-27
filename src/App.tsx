import { AppShell } from "./components/AppShell";
import { WorkspaceProvider } from "./workspace/WorkspaceContext";

export default function App() {
  return (
    <WorkspaceProvider>
      <AppShell />
    </WorkspaceProvider>
  );
}
