import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from "../firebaseConfig";


export const AuthContext = createContext();

export const AuthContextProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(undefined);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user)=>{
            if(user){
                setIsAuthenticated(true);
                setUser(user);
            }else{
                setIsAuthenticated(false);
                setUser(null);
            }
        });
        return unsub;
    }, [])

    const signin = async (email, password)=>{
        try {
            
        } catch (e) {
            
        }
    }

    const signout = async ()=>{
        try {
            
        } catch (e) {
            
        }
    }

    const signup = async (email, password, name)=>{
        try {
            const response = await createUserWithEmailAndPassword(auth, email, password);
            console.log('response.user: ', response?.user);

            await setDoc(doc(db, "users", response?.user?.uid), {
                name,
                userId: response?.user?.uid
            });
            return {success: true, data: response?.user};
        } catch (e) {
            return {success: false, msg: e.message};
        }
    }

    return (
        <AuthContext.Provider value={{user, isAuthenticated, signin, signup, signout}}>
            {children}
        </AuthContext.Provider>
    )

}

export const useAuth = ()=>{
    const value = useContext(AuthContext);

    if(!value){
        throw new Error('useAuth must be wrapped inside AuthContextProvider');
    }
    return value;
}