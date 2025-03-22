
import { Link } from 'react-router-dom';
import cloverLogo from '../../assets/CLOVER.svg';


const NavBar = () => {

    return(
      <nav className="flex justify-between items-center py-3 px-4 md:px-10 bg-black text-white fixed w-full top-0 shadow-md z-50">
        <div className="flex items-center space-x-2 md:space-x-3">
          <img src={cloverLogo} alt="Clover Logo" className="h-8 md:h-10" />
          <span className="text-lg md:text-2xl font-bold tracking-wide text-[#50B498]">Clover</span>
        </div>
        <ul className="flex space-x-3 md:space-x-6 text-sm md:text-lg">
          <li><Link to="/" className="hover:text-[#50B498] transition">Home</Link></li>
          <li><Link to="/dashboard" className="hover:text-[#50B498] transition">Dashboard</Link></li>
          <li><Link to="/about" className="hover:text-[#50B498] transition">About</Link></li>
          <li>
            <Link to="/login" className="px-3 py-1 md:px-4 md:py-2 bg-[#50B498] text-white font-semibold rounded-lg bg-white/25 hover:bg-white hover:text-black transition">
              Log In
            </Link>
          </li>
          <li>
            <Link to="/signup" className="px-3 py-1 md:px-4 md:py-2 bg-[#50B498] text-black font-semibold rounded-lg hover:bg-white hover:text-black transition">
             Sign Up
            </Link>
          </li>
        </ul>
      </nav>
    );
}
export default NavBar;