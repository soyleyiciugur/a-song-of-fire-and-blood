import AuthForm from "../AuthForm"; import { updatePassword } from "../actions";
export default function Page(){return <AuthForm title="Choose a new password" intro="Use at least eight characters and keep it somewhere safe." action={updatePassword} fields={[{name:"password",label:"New password",type:"password",autoComplete:"new-password",minLength:8}]} submit="Update password"/>}
