import { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { Outlet } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loadTheme } from '../features/themeSlice'
import { Loader2Icon } from 'lucide-react'
import { useUser, SignIn, useAuth, CreateOrganization, useOrganization } from '@clerk/clerk-react'
import { fetchWorkspaces } from '../features/workspaceSlice'
import api from '../configs/api'

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const { loading, workspaces } = useSelector((state) => state.workspace)
    const dispatch = useDispatch()
    const { user, isLoaded} = useUser()
    const { getToken, orgId } = useAuth()
    const { organization } = useOrganization()
    const hasCurrentOrgWorkspace = !!orgId && workspaces.some((workspace) => workspace.id === orgId)
    const getTokenRef = useRef(getToken)
    const fetchedUserIdRef = useRef(null)
    const syncedOrgRef = useRef(new Set())

    // Initial load of theme
    useEffect(() => {
        dispatch(loadTheme())
    }, [dispatch])

    useEffect(() => {
        getTokenRef.current = getToken
    }, [getToken])

    // Initial load of workspaces once per user
    useEffect(() => {
        if (!isLoaded || !user) return
        if (fetchedUserIdRef.current === user.id) return
        fetchedUserIdRef.current = user.id
        dispatch(fetchWorkspaces({ getToken: getTokenRef.current }))
    }, [dispatch, isLoaded, user])

    useEffect(() => {
        if (!user) {
            fetchedUserIdRef.current = null
            syncedOrgRef.current.clear()
        }
    }, [user])

    // Fallback sync path: ensure active Clerk org exists in local DB
    useEffect(() => {
        if (!isLoaded || !user || !orgId || hasCurrentOrgWorkspace || !organization) return
        if (organization.id !== orgId) return
        if (syncedOrgRef.current.has(orgId)) return

        syncedOrgRef.current.add(orgId)

        const syncWorkspace = async () => {
            try {
                const token = await getTokenRef.current()
                await api.post(
                    '/api/workspaces/sync-current',
                    {
                        id: organization.id,
                        name: organization.name,
                        slug: organization.slug,
                        image_url: organization.imageUrl || '',
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                )
            } catch (error) {
                console.log(error?.response?.data?.message || error.message)
            } finally {
                dispatch(fetchWorkspaces({ getToken: getTokenRef.current }))
            }
        }

        syncWorkspace()
    }, [dispatch, hasCurrentOrgWorkspace, isLoaded, orgId, organization, user])

    if(!user){
        return (
            <div className='flex justify-center items-center h-screen bg-white dark:bg-zinc-950'>
                <SignIn />
            </div>
        )
    }

    if (loading && workspaces.length === 0 && !orgId) return (
        <div className='flex items-center justify-center h-screen bg-white dark:bg-zinc-950'>
            <Loader2Icon className="size-7 text-blue-500 animate-spin" />
        </div>
    )



    return (
        <div className="flex bg-white dark:bg-zinc-950 text-gray-900 dark:text-slate-100">
            <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            <div className="flex-1 flex flex-col h-screen">
                <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
                <div className="flex-1 h-full p-6 xl:p-10 xl:px-16 overflow-y-scroll">
                    {!orgId ? ( <div className="min-h-full flex justify-center items-center"><CreateOrganization afterCreateOrganizationUrl="/" afterSelectOrganizationUrl="/" /></div> ) : ( <Outlet /> )}
                </div>
            </div>
        </div>
    )
}

export default Layout







