import FullPageLoader from "./FullPageLoader";

type RouteLoadingFallbackProps = {
  message?: string;
};

/** Suspense fallback — full-screen loader instead of a blank/white "Loading..." div. */
const RouteLoadingFallback = ({
  message = "Loading…",
}: RouteLoadingFallbackProps) => <FullPageLoader open message={message} />;

export default RouteLoadingFallback;
