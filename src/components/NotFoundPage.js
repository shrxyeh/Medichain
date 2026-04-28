import { useNavigate } from "react-router-dom";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 flex items-center justify-center px-4">
      <div className="glass-card rounded-2xl p-10 max-w-md w-full text-center">
        <p className="text-7xl font-bold text-teal-400 mb-4">404</p>
        <h2 className="text-2xl font-bold text-white mb-2">Page Not Found</h2>
        <p className="text-gray-400 text-sm mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button
          onClick={() => navigate("/")}
          className="btn-primary px-8 py-3 w-full"
        >
          Go Home
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
