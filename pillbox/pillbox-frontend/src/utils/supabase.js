import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tptnowejgljcojjpisvc.supabase.co';
const supabaseKey = 'sb_publishable_24LQedmil4rxGU3Ex3PL0w_P1zsoEdD';

export const supabase = createClient(supabaseUrl, supabaseKey);
