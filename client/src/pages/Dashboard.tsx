import useCurrentUser from "../utils/useCurrentUser"

const Dashboard = () => {
    const currentUser = useCurrentUser().data?.user

  return (
    <div>
        <h1>
            {!currentUser ? <p>loading...</p> : <p>{currentUser.full_name}</p>}
        </h1>
        
        Dashboard

    </div>
  )
}

export default Dashboard