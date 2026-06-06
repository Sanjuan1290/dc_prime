import jwt from 'jsonwebtoken'
import { db } from '../db/connect.js'

const useCurrentUser = async (req, res) => {
    try{
        const token = req.cookies.token

        if(!token) return res.status(401).json({ message: 'Not Authorize || not logged in yet', isLoggedIn: false})

        const user = jwt.verify(token, process.env.JWT_SECRET)
    
        if(!user) return res.status(401).json({ message: 'Not Authorize || not logged in yet', isLoggedIn: false})

        const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [user.id])

        if(rows.length === 0) return res.status(401).json({ message: 'Cookie exist but not in database!?', isLoggedIn: false})

        console.log(rows[0]);

        return res.status(200).json({ message: 'Already Logged in', user: rows[0], isLoggedIn: true})
    } catch(err) {
        console.log(err);
        return res.status(500).json({ message: "Internal server error"})
    }
}

export default useCurrentUser