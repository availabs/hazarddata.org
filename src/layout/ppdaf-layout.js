import React from "react";
import { useTheme, TopNav, SideNav, FlyoutMenu } from "modules/avl-components/src/";
import { Link } from "react-router-dom";
import AuthMenu from "pages/Auth/AuthMenu"
import {getDomain, getSubdomain} from "utils"
import get from 'lodash.get'


const dataManagerCats = {
	freightatlas: 'Freight Atlas'
}


const Logo = ({sideNav}) => {
	const theme = useTheme()
	const themeOptions = {size: get(sideNav, 'size','micro') ,color: get(sideNav, 'color','dark')}
	return (
		<>
		<Link to="/" className={`${theme.sidenav(themeOptions).logoWrapper} flex flex-col items-center justify-center`}>
			<div>
				<img src='/nys_logo.svg' className='w-full h-12' alt='New York State Logo' />
			</div>	
		</Link>
		</>
	)
}



const Layout = ({ children, menus, sideNav, title, site }) => {
	const theme = useTheme()
	const themeOptions = {size: get(sideNav, 'size','none') ,color: get(sideNav, 'color','dark')}
	
	const PROJECT_HOST = getDomain(window.location.host)//psl.parse(window.location.host).domain
	const SUBDOMAIN = getSubdomain(window.location.host)

	return (
		<div className='flex ' >
			<div className={`hidden md:block`}>
				<div className='fixed h-screen'>
					<SideNav 
						topMenu={
							<Logo sideNav={sideNav}/>
						}
						themeOptions={themeOptions}
						menuItems={menus}
					/>
				</div>
			</div>
			<div className={`flex-1 flex items-start flex-col items-stretch min-h-screen`}>
				
				<div className={`${theme.sidenav(themeOptions).fixed}`}>
					<TopNav
						leftMenu={
							<>
								<div className='flex items-center justify-center h-16'>
									<Link to="/" className={`${themeOptions.size === 'none' ? '' : 'md:hidden'}` }>
										<div className='px-2 font-medium text-lg'>
											Hazard Data
										</div>
									</Link>
									
									<div className={`text-2xl font-thin text-blue-500  flex-1` }>
										<div className='h-[34px] overflow-hidden'> {title} </div>
									</div>
								</div>
								<div>
									
								</div>
							</>
						}
						rightMenu={<AuthMenu />}
						menuItems={[
							
							{
								name: "Declared Disasters",
								path: `/disaster/4020`,
								icon: "fa-regular fa-wind-warning",
							},
							{
								name: "Geography",
								path: `/geography/36001`,
								icon: "fa-regular fa-globe-stand",
							},
							{
								name: "Map",
								path: `/map`,
								icon: "fa-regular fa-map",
							},
							{
								name: "Download",
								path: `/datasources`,
								icon: "fa-regular fa-download",
							},
							{
								name: "Docs",
								path: `/docs`,
								icon: "fa-regular fa-file",
							},
							// {
							// 	name: "Data Sources",
							// 	path: `/datasources${dataManagerCats[SUBDOMAIN] ? '/cat/'+dataManagerCats[SUBDOMAIN] : ''}`,
							// 	icon: "fa-regular fa-database",
							// }
						]}
					/>
				</div>
				<div className={`px-1 h-full flex-1 bg-gradient-to-tr from-[#d7d8d5] to-[#faf2e7] ${theme.sidenav(themeOptions).fixed}`}>{children}</div>
			</div>
		</div>
	);
};

export default Layout;