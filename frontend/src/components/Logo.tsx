import logo from "../assets/logo.png";

export function Logo({ className = "h-9 w-9" }: { className?: string }) {
  return <img src={logo} alt="Nyumba Yangu" className={`${className} rounded-xl object-cover`} />;
}
