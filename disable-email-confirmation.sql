-- Desabilitar confirmação de email para desenvolvimento

-- 1. Confirmar todos os usuários existentes
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- 2. Para novos usuários, eles serão confirmados automaticamente pelo trigger