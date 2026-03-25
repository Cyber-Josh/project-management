import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import { assets } from '../assets/assets'
import StatsGrid from '../components/StatsGrid'
import ProjectOverview from '../components/ProjectOverview'
import RecentActivity from '../components/RecentActivity'
import TasksSummary from '../components/TasksSummary'
import CreateProjectDialog from '../components/CreateProjectDialog'

const Dashboard = () => {
    const user = { fullName: 'User' }
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const { workspaces } = useSelector((state) => state.workspace)

    const visibleWorkspaces = workspaces.slice(0, 6)
    const hiddenWorkspacesCount = workspaces.length - visibleWorkspaces.length

    return (
        <div className='max-w-6xl mx-auto'>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 ">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-1"> Welcome back, {user?.fullName || 'User'} </h1>
                    <p className="text-gray-500 dark:text-zinc-400 text-sm"> Here's what's happening with your projects today </p>
                </div>

                <button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2 px-5 py-2 text-sm rounded bg-gradient-to-br from-blue-500 to-blue-600 text-white space-x-2 hover:opacity-90 transition" >
                    <Plus size={16} /> New Project
                </button>

                <CreateProjectDialog isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
            </div>

            <div className="my-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Workspaces</p>
                        <p className="text-2xl font-bold text-zinc-900 dark:text-white">{workspaces.length}</p>
                    </div>

                    <div className="flex items-center">
                        {visibleWorkspaces.map((workspace, index) => (
                            <img
                                key={workspace.id}
                                src={workspace?.image_url || assets.workspace_img_default}
                                alt={workspace?.name || 'Workspace'}
                                title={workspace?.name || 'Workspace'}
                                className={`size-10 rounded-full border-2 border-white dark:border-zinc-900 shadow ${index > 0 ? '-ml-2' : ''}`}
                            />
                        ))}
                        {hiddenWorkspacesCount > 0 && (
                            <div className="-ml-2 size-10 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 flex items-center justify-center">
                                +{hiddenWorkspacesCount}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <StatsGrid />

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <ProjectOverview />
                    <RecentActivity />
                </div>
                <div>
                    <TasksSummary />
                </div>
            </div>
        </div>
    )
}

export default Dashboard
